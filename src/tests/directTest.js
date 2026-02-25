const db = require('../db');

async function identify(email, phoneNumber) {
    phoneNumber = phoneNumber ? String(phoneNumber) : null;
    console.log(`\nIdentify: email=${email}, phoneNumber=${phoneNumber}`);

    return await db.transaction(async (trx) => {
        // 1. Find all contacts that match
        const matchingContacts = await trx("Contact")
            .where((builder) => {
                if (email) builder.orWhere({ email });
                if (phoneNumber) builder.orWhere({ phoneNumber });
            });

        if (matchingContacts.length === 0) {
            const [id] = await trx("Contact").insert({ email, phoneNumber, linkPrecedence: "primary" });
            return { contact: { primaryContactId: id, emails: [email].filter(Boolean), phoneNumbers: [phoneNumber].filter(Boolean), secondaryContactIds: [] } };
        }

        const primaryIds = new Set();
        matchingContacts.forEach(c => primaryIds.add(c.linkedId || c.id));

        let allRelatedContacts = await trx("Contact")
            .whereIn("id", Array.from(primaryIds))
            .orWhereIn("linkedId", Array.from(primaryIds));

        allRelatedContacts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const oldestContact = allRelatedContacts[0];
        const primaryId = oldestContact.id;

        if (oldestContact.linkPrecedence !== "primary" || oldestContact.linkedId !== null) {
            await trx("Contact").where({ id: primaryId }).update({ linkPrecedence: "primary", linkedId: null, updatedAt: trx.fn.now() });
        }

        const otherContacts = allRelatedContacts.filter(c => c.id !== primaryId);
        const updatesNeeded = otherContacts.filter(c => c.linkPrecedence !== "secondary" || c.linkedId !== primaryId);

        if (updatesNeeded.length > 0) {
            const updateIds = updatesNeeded.map(c => c.id);
            await trx("Contact").whereIn("id", updateIds).update({ linkPrecedence: "secondary", linkedId: primaryId, updatedAt: trx.fn.now() });
            await trx("Contact").whereIn("linkedId", updateIds).update({ linkedId: primaryId, updatedAt: trx.fn.now() });
            allRelatedContacts = await trx("Contact").where({ id: primaryId }).orWhere({ linkedId: primaryId });
            allRelatedContacts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        const hasEmailMatch = allRelatedContacts.some(c => c.email === email);
        const hasPhoneMatch = allRelatedContacts.some(c => c.phoneNumber === phoneNumber);

        if (email && phoneNumber && (!hasEmailMatch || !hasPhoneMatch)) {
            const [newId] = await trx("Contact").insert({ email, phoneNumber, linkedId: primaryId, linkPrecedence: "secondary" });
            const [newSecondary] = await trx("Contact").where({ id: newId });
            allRelatedContacts.push(newSecondary);
        }

        const primaryContactInList = allRelatedContacts.find(c => c.id === primaryId);
        const emails = Array.from(new Set([primaryContactInList.email, ...allRelatedContacts.map(c => c.email)])).filter(Boolean);
        const phoneNumbers = Array.from(new Set([primaryContactInList.phoneNumber, ...allRelatedContacts.map(c => c.phoneNumber)])).filter(Boolean);
        const secondaryContactIds = allRelatedContacts.filter(c => c.id !== primaryId).map(c => c.id);

        return { contact: { primaryContactId: primaryId, emails, phoneNumbers, secondaryContactIds: Array.from(new Set(secondaryContactIds)) } };
    });
}

async function runTests() {
    try {
        // Clear DB for clean test
        await db("Contact").del();

        console.log(JSON.stringify(await identify("lorraine@hillvalley.edu", "123456"), null, 2));
        console.log(JSON.stringify(await identify("mcfly@hillvalley.edu", "123456"), null, 2));
        console.log(JSON.stringify(await identify("george@hillvalley.edu", "919191"), null, 2));
        console.log(JSON.stringify(await identify("biffsucks@hillvalley.edu", "717171"), null, 2));
        console.log(JSON.stringify(await identify("george@hillvalley.edu", "717171"), null, 2));
    } finally {
        await db.destroy();
    }
}

runTests();
