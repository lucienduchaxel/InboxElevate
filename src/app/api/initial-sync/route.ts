import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { Account } from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";

export const POST = async (req: NextRequest) => {
    const {accountId, userId} = await req.json()
    if(!accountId || !userId) return NextResponse.json("Missing accountId or userId", {status: 400})

    const dbAccount = await db.account.findUnique({
        where:{
            id: accountId,
            userId
        }
    })

    if(!dbAccount) return NextResponse.json("Account not found", {status: 404})
    
    const account = new Account(dbAccount.accessToken)
    const response = await account.performInitialSync()
    if(!response) return NextResponse.json("Failed to perform initial sync", {status: 500})
    
    const {emails, deltaToken} = response
    await db.account.update({
        where:{
            id: accountId
         },
        data: {
            nextDeltaToken: deltaToken
        }
    })

    await syncEmailsToDatabase(emails, accountId)
    console.log('sync complete')
    return NextResponse.json({success: true}, {status: 200})
    
}