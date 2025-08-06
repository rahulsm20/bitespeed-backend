import { buildFilters, formatResponse } from "@/utils";
import { LinkPrecedence } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../prisma/client";

export const identityReconciliationController = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body as { email?: string; phoneNumber?: string };

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: "Email or phone number is required." });
  }
  const OR: any[] = buildFilters(email, phoneNumber);
  const relatedContacts = await prisma.contact.findMany({
    where: {
      OR
    },
    orderBy: { createdAt: "asc" },
    include: { primaryContact: true, secondaryContacts: true },
  });

  let primaryContact;

  if (relatedContacts.length === 0) {
    // no existing contact → create new primary
    primaryContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: LinkPrecedence.primary,
      },
      include: { primaryContact: true, secondaryContacts: true },
    });
  } else {
    const oldest = relatedContacts[0];

    if (oldest.linkPrecedence !== LinkPrecedence.primary) {
      primaryContact = await prisma.contact.update({
        where: { id: oldest.id },
        data: { linkPrecedence: LinkPrecedence.primary, primaryContactId: null },
        include: { primaryContact: true, secondaryContacts: true },
      });
    } else {
      primaryContact = oldest;
    }

    const secondaryIds = relatedContacts.slice(1).map(c => c.id);
    if (secondaryIds.length > 0) {
      await prisma.contact.updateMany({
        where: { id: { in: secondaryIds } },
        data: { linkPrecedence: LinkPrecedence.secondary, primaryContactId: primaryContact.id },
      });
    }

    const existingEmails = new Set(relatedContacts.map(c => c.email).filter(Boolean));
    const existingPhones = new Set(relatedContacts.map(c => c.phoneNumber).filter(Boolean));

    if ((email && !existingEmails.has(email)) || (phoneNumber && !existingPhones.has(phoneNumber))) {
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: LinkPrecedence.secondary,
          primaryContactId: primaryContact.id,
        },
      });
    }

    primaryContact = await prisma.contact.findUnique({
      where: { id: primaryContact.id },
      include: { primaryContact: true, secondaryContacts: true },
    });
  }

  const response = formatResponse(primaryContact!);

  return res.status(200).json({ contact: response });
};
