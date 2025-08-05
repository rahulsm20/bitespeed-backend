import { formatResponse } from "@/utils";
import { LinkPrecedence } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../prisma/client";

//--------------------------------------------------------------------------

export const identityReconiciliationController = async (
  req: Request,
  res: Response
) => {
  const { email, phoneNumber } = req.body as {
    email?: string;
    phoneNumber?: string;
  };

  if (!email && !phoneNumber) {
    return res
      .status(400)
      .json({ error: "Email or phone number are required." });
  }

  const user = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email ? { equals: email, mode: "insensitive" } : undefined },
        { phoneNumber: phoneNumber ? { equals: `${phoneNumber}` } : undefined },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      primaryContact: true,
      secondaryContacts: true,
    },
  });

  if (user.length === 0) {
    const newUser = await prisma.contact.create({
      data: {
        email,
        phoneNumber: `${phoneNumber}`,
        linkPrecedence: LinkPrecedence.primary,
      },
      include: {
        primaryContact: true,
        secondaryContacts: true,
      },
    });

    return res.status(200).json({ contact: formatResponse(newUser) });
  } else {
    // turn all related expect oldest contact to secondary
    const OR: any[] = [];
    if (email) OR.push({ email: { equals: email, mode: "insensitive" } });
    if (phoneNumber) OR.push({ phoneNumber: { equals: phoneNumber } });
    const debug = await prisma.contact.findMany({ where: { OR } });
    console.log({ debug });

    const primaryContact = await prisma.contact.findFirst({
      where: {
        linkPrecedence: LinkPrecedence.primary,
        ...(OR.length > 0 && { OR }),
      },
      include: {
        primaryContact: true,
        secondaryContacts: true,
      },
    });

    console.log({ primaryContact });
    if (!primaryContact) {
      return res.status(404).json({ error: "Primary contact not found." });
    }

    await prisma.contact.updateMany({
      where: {
        id: {
          in: user.map((contact) => contact.id),
          not: primaryContact.id,
        },
      },
      data: {
        linkPrecedence: LinkPrecedence.secondary,
        primaryContactId: primaryContact.id,
      },
    });

    let contact = formatResponse(primaryContact);

    if (
      (email != undefined && !contact.emails.includes(email)) ||
      (phoneNumber != undefined && !contact.phoneNumbers.includes(phoneNumber))
    ) {
      console.log(
        { contact },
        email != undefined && !contact.emails.includes(email),
        phoneNumber != undefined && !contact.phoneNumbers.includes(phoneNumber)
      );
      // add new contact
      await prisma.contact.create({
        data: {
          email,
          phoneNumber: `${phoneNumber}`,
          linkPrecedence: LinkPrecedence.secondary,
          primaryContactId: primaryContact.id,
        },
      });

      const updatedContact = await prisma.contact.findUnique({
        where: { id: primaryContact.id },
        include: {
          primaryContact: true,
          secondaryContacts: true,
        },
      });

      if (updatedContact) {
        contact = formatResponse(updatedContact);
      }
    }
    return res.status(200).json({ contact });
  }
};
