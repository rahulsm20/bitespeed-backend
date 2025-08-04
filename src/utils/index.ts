import { LinkPrecedence } from "@prisma/client";
import { ContactWithPayload } from "types";

//--------------------------------------------------------------------------

type ResultType = {
  primaryContactId: Number | null;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: Number[];
};

//--------------------------------------------------------------------------

export const formatResponse = (contact: ContactWithPayload) => {
  const res: ResultType = {
    primaryContactId: 0,
    emails: [],
    phoneNumbers: [],
    secondaryContactIds: [],
  };

  if (contact.linkPrecedence == LinkPrecedence.primary) {
    res.primaryContactId = contact.id;
  } else if (contact.linkPrecedence == LinkPrecedence.secondary) {
    res.primaryContactId = contact.primaryContactId;
  }

  res.secondaryContactIds = contact.secondaryContacts
    ? contact.secondaryContacts.map((contact) => contact.id)
    : [];

  const emails = new Set<string>();
  const phoneNumbers = new Set<string>();

  if (contact.primaryContact) {
    if (contact.primaryContact.email) {
      emails.add(contact.primaryContact.email);
    }
    if (contact.primaryContact.phoneNumber) {
      phoneNumbers.add(contact.primaryContact.phoneNumber);
    }
  }

  if (contact.email) {
    emails.add(contact.email);
  }
  if (contact.phoneNumber) {
    phoneNumbers.add(contact.phoneNumber);
  }

  if (contact.secondaryContacts) {
    contact.secondaryContacts.forEach((secondaryContact) => {
      if (secondaryContact.email) {
        emails.add(secondaryContact.email);
      }
      if (secondaryContact.phoneNumber) {
        phoneNumbers.add(secondaryContact.phoneNumber);
      }
    });
  }

  res.emails = Array.from(emails);
  res.phoneNumbers = Array.from(phoneNumbers);
  return res;
};
