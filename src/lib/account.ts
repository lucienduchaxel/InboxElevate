import { SyncResponse, SyncUpdatedResponse, EmailMessage } from '@/types';
import { Param } from '@prisma/client/runtime/library';
import axios from 'axios';

export class Account {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async startSync() {
        const response = await axios.post<SyncResponse>('https://api.aurinko.io/v1/email/sync', {}, {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
            params: {
                daysWithin: 2,
                bodyType: 'html'
            }
        })
        return response.data
    }

    async getUpdatedEmails({deltaToken, pageToken}: {deltaToken?: string, pageToken?: string}) {
        let params: Record<string, string> = {}
        if(deltaToken) params.deltaToken = deltaToken
        if(pageToken) params.pageToken = pageToken

        const reponse = await axios.get<SyncUpdatedResponse>('https://api.aurinko.io/v1/email/sync/updated', {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
            params
        })
        return reponse.data
    }

    async performInitialSync() {
        try {
            let syncResponse = await this.startSync()
            while (!syncResponse.ready) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                syncResponse = await this.startSync()
            }


            let storedDeltaToken: string = syncResponse.syncUpdatedToken

            let updatedReponse = await this.getUpdatedEmails({deltaToken: storedDeltaToken})

            if(updatedReponse.nextDeltaToken) {
                storedDeltaToken = updatedReponse.nextDeltaToken
            }

            let allEmails: EmailMessage[] = updatedReponse.records

            while(updatedReponse.nextPageToken) {
                updatedReponse = await this.getUpdatedEmails({pageToken: updatedReponse.nextPageToken})
                allEmails = allEmails.concat(updatedReponse.records)
                if(updatedReponse.nextDeltaToken) {
                    storedDeltaToken = updatedReponse.nextDeltaToken
                }
            }

            console.log('initial sync complete')

            await this.getUpdatedEmails({deltaToken: storedDeltaToken})

            return {
                emails: allEmails,
                deltaToken: storedDeltaToken,
            }
        } catch (error) {
            
        }
    }
}