import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import db from "./db";

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ status: "ok", message: "BiteSpeed Identity Service is running" });
});

app.use(bodyParser.json());

interface IdentifyRequest {
  email?: string;
  phoneNumber?: string | number;
}

interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: "primary" | "secondary";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

app.post('/identify', async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber: rawPhoneNumber } = req.body as IdentifyRequest;
    const phoneNumber = rawPhoneNumber ? String(rawPhoneNumber) : null;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "Email or phoneNumber is required" });
    }

    const result = await db.transaction(async (trx: any) => {
      // 1. Find all contacts that match either email or phoneNumber
      const matchingContacts: Contact[] = await trx("Contact")
        .where((builder: any) => {
          if (email) builder.orWhere({ email });
          if (phoneNumber) builder.orWhere({ phoneNumber });
        });

      if (matchingContacts.length === 0) {
        // Create a new primary contact
        const [id] = await trx("Contact").insert({
          email,
          phoneNumber,
          linkPrecedence: "primary"
        });

        return {
          contact: {
            primaryContactId: id,
            emails: email ? [email] : [],
            phoneNumbers: phoneNumber ? [phoneNumber] : [],
            secondaryContactIds: []
          }
        };
      }

      // 2. Identify all related contacts (the entire link group)
      const primaryIds = new Set<number>();
      matchingContacts.forEach(c => {
        primaryIds.add(c.linkedId || c.id);
      });

      let allRelatedContacts: Contact[] = await trx("Contact")
        .whereIn("id", Array.from(primaryIds))
        .orWhereIn("linkedId", Array.from(primaryIds));

      // 3. Strictly enforce the oldest contact as primary
      allRelatedContacts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const oldestContact = allRelatedContacts[0];
      const primaryId = oldestContact.id;

      // Handle primary/secondary conversion for the oldest if needed
      if (oldestContact.linkPrecedence !== "primary" || oldestContact.linkedId !== null) {
        await trx("Contact")
          .where({ id: primaryId })
          .update({
            linkPrecedence: "primary",
            linkedId: null,
            updatedAt: trx.fn.now()
          });
      }

      // 4. Correctly merge multiple link groups if necessary
      const otherContacts = allRelatedContacts.filter(c => c.id !== primaryId);
      const updatesNeeded = otherContacts.filter(c => c.linkPrecedence !== "secondary" || c.linkedId !== primaryId);

      if (updatesNeeded.length > 0) {
        const updateIds = updatesNeeded.map(c => c.id);
        await trx("Contact")
          .whereIn("id", updateIds)
          .update({
            linkPrecedence: "secondary",
            linkedId: primaryId,
            updatedAt: trx.fn.now()
          });

        // Ensure contacts previously linked to those are also updated
        await trx("Contact")
          .whereIn("linkedId", updateIds)
          .update({
            linkedId: primaryId,
            updatedAt: trx.fn.now()
          });

        // Re-fetch all related contacts to reflect changes
        allRelatedContacts = await trx("Contact")
          .where({ id: primaryId })
          .orWhere({ linkedId: primaryId });
        allRelatedContacts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      // 5. Check if we need to create a new secondary contact
      const hasEmailMatch = allRelatedContacts.some(c => c.email === email);
      const hasPhoneMatch = allRelatedContacts.some(c => c.phoneNumber === phoneNumber);

      if (email && phoneNumber && (!hasEmailMatch || !hasPhoneMatch)) {
        // If one matched but the other is new, create a secondary
        const [newId] = await trx("Contact").insert({
          email,
          phoneNumber,
          linkedId: primaryId,
          linkPrecedence: "secondary"
        });
        const [newSecondary] = await trx("Contact").where({ id: newId });
        allRelatedContacts.push(newSecondary);
      }

      // 6. Build response with correct ordering
      // Primary contact's info first
      const primaryContactInList = allRelatedContacts.find(c => c.id === primaryId)!;

      const emails = Array.from(new Set([
        primaryContactInList.email,
        ...allRelatedContacts.map(c => c.email)
      ])).filter((e): e is string => !!e);

      const phoneNumbers = Array.from(new Set([
        primaryContactInList.phoneNumber,
        ...allRelatedContacts.map(c => c.phoneNumber)
      ])).filter((p): p is string => !!p);

      const secondaryContactIds = allRelatedContacts
        .filter(c => c.id !== primaryId)
        .map(c => c.id);

      return {
        contact: {
          primaryContactId: primaryId,
          emails,
          phoneNumbers,
          secondaryContactIds: Array.from(new Set(secondaryContactIds))
        }
      };
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error("Error in /identify:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
