'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { generateEmail, indentChatCount } from './action'
import { readStreamableValue } from "ai/rsc"
import useThreads from '@/hooks/user-threads'
import { turndown } from '@/lib/turndown'
import { api } from '@/trpc/react'
import { toast } from 'sonner'


type Props = {
    isComposing: boolean,
    onGenerate: (token: string) => void
}

const AIComposeButton = (props: Props) => {
    const [open, setOpen] = React.useState(false)
    const [prompt, setPrompt] = React.useState('')
    const { threads, threadId, account } = useThreads()
    const thread = threads?.find(t => t.id === threadId)
    const utils = api.useUtils()


    const aiGenerate = async () => {
        let context = ''

        if (props.isComposing) {
            for (const email of thread?.emails ?? []) {
                const content = `
                    Subject: ${email.subject}
                    From: ${email.from.address}
                    Sent: ${new Date(email.sentAt).toLocaleString()}
                    Bodu: ${turndown.turndown(email.body ?? email.bodySnippet ?? "")}
                 `

                context += content
            }
        }

        context += `
            My name is ${account?.name} and my email is ${account?.emailAddress}
        `

        try {
            await indentChatCount()
            await utils.account.getChatbotInteraction.refetch()
            const { output } = await generateEmail(context, prompt)
            for await (const token of readStreamableValue(output)) {
                props.onGenerate(token)
            }
        } catch (error: any) {
            toast.error(error.message)
        }
       
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button size='icon' variant={'outline'} onClick={() => setOpen(true)}>
                <Bot className='size-5' />
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ai Smart Sompose</DialogTitle>
                    <DialogDescription>
                        AI will help you compose your email
                    </DialogDescription>
                    <div className='h-2'> </div>
                    <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                    <div className='h-2'> </div>
                    <Button onClick={() => {
                        aiGenerate()
                        setOpen(false)
                        setPrompt('')
                    }}>
                        Generate
                    </Button>
                </DialogHeader>
            </DialogContent>
        </Dialog>

    )
}

export default AIComposeButton