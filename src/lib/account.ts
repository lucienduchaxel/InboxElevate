import { db } from "@/server/db";
import {
  SyncResponse,
  SyncUpdatedResponse,
  EmailMessage,
  EmailAddress,
} from "@/types";
import { Param } from "@prisma/client/runtime/library";
import axios from "axios";
import { syncEmailsToDatabase } from "./sync-to-db";

export class Account {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async startSync() {
    const response = await axios.post<SyncResponse>(
      "https://api.aurinko.io/v1/email/sync",
      {},
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params: {
          daysWithin: 2,
          bodyType: "html",
        },
      },
    );
    return response.data;
  }

  async getUpdatedEmails({
    deltaToken,
    pageToken,
  }: {
    deltaToken?: string;
    pageToken?: string;
  }) {
    let params: Record<string, string> = {};
    if (deltaToken) params.deltaToken = deltaToken;
    if (pageToken) params.pageToken = pageToken;

    const reponse = await axios.get<SyncUpdatedResponse>(
      "https://api.aurinko.io/v1/email/sync/updated",
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        params,
      },
    );
    return reponse.data;
  }

  async performInitialSync() {
    try {
      let syncResponse = await this.startSync();
      while (!syncResponse.ready) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        syncResponse = await this.startSync();
      }

      let storedDeltaToken: string = syncResponse.syncUpdatedToken;

      let updatedReponse = await this.getUpdatedEmails({
        deltaToken: storedDeltaToken,
      });

      if (updatedReponse.nextDeltaToken) {
        storedDeltaToken = updatedReponse.nextDeltaToken;
      }

      let allEmails: EmailMessage[] = updatedReponse.records;

      while (updatedReponse.nextPageToken) {
        updatedReponse = await this.getUpdatedEmails({
          pageToken: updatedReponse.nextPageToken,
        });
        allEmails = allEmails.concat(updatedReponse.records);
        if (updatedReponse.nextDeltaToken) {
          storedDeltaToken = updatedReponse.nextDeltaToken;
        }
      }

      console.log("initial sync complete");

      await this.getUpdatedEmails({ deltaToken: storedDeltaToken });

      return {
        emails: allEmails,
        deltaToken: storedDeltaToken,
      };
    } catch (error) {}
  }

  async sendEmail({
    from,
    subject,
    body,
    inReplyTo,
    threadId,
    reference,
    to,
    cc,
    bcc,
    replyTo,
  }: {
    from: EmailAddress;
    subject: string;
    body: string;
    inReplyTo?: string;
    threadId?: string;
    reference?: string;
    to: EmailAddress[];
    cc?: EmailAddress[];
    bcc?: EmailAddress[];
    replyTo?: EmailAddress;
  }) {
    try {
      const response = await axios.post(
        "https://api.aurinko.io/v1/email/messages",
        {
          from,
          subject,
          body,
          inReplyTo,
          reference,
          to,
          threadId,
          cc,
          bcc,
          replyTo: [replyTo],
        },
        {
          params: {
            returnIds: true,
          },
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );
      console.log("Email sent");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error sending email:",
          JSON.stringify(error.response?.data, null, 2),
        );
      } else {
        console.error("Error sending email:", error);
      }
      throw error;
    }
  }

  async syncEmails() {
    const account = await db.account.findUnique({
      where: { accessToken: this.token },
    });
    if (!account) throw new Error("Account not found");
    if (!account.nextDeltaToken) throw new Error("Account not ready for sync");
    let response = await this.getUpdatedEmails({
      deltaToken: account.nextDeltaToken,
    });
    let storedDeltaToken = account.nextDeltaToken
    let allEmails: EmailMessage[] = response.records


    if(response.nextDeltaToken){
      storedDeltaToken = response.nextDeltaToken
    }

    while(response.nextPageToken){
      response = await this.getUpdatedEmails({pageToken: response.nextPageToken})
      allEmails = allEmails.concat(response.records)
    }

    try {
      syncEmailsToDatabase(allEmails,account.id)
    } catch (error) {
      console.log('error during sync')
    }

    await db.account.update({
      where: { id: account.id},
      data: {
        nextDeltaToken: storedDeltaToken
      }
    })

    return {
      emails: allEmails,
      deltaToken: storedDeltaToken
    }
  }
}
