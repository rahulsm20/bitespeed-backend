import { Prisma } from "@prisma/client";

export enum LinkPrecedence {
  primary = "primary",
  secondary = "secondary",
}

export type Contact = {
  phoneNumber: string | null;
  email: string | null;
  linkPrecedence?: LinkPrecedence;
  createdAt?: Date;
  updatedAt?: Date;
  id?: number;
  linkedId?: number | null;
};

export type ContactWithPayload = Prisma.ContactGetPayload<{
  include: { secondaryContacts: true; primaryContact: true };
}>;
