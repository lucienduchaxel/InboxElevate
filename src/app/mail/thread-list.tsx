'use client'

import useThreads from '@/hooks/user-threads'
import { format, formatDistanceToNow } from 'date-fns'
import DOMPurify from 'dompurify'
import React, { ComponentProps } from 'react'
import { cn } from "@/lib/utils"
import { Badge } from '@/components/ui/badge'

const ThreadList = () => {
    const { threads, threadId, setThreadId } = useThreads()

    const groupedThreads = threads?.reduce((acc, thread) => {
        const date = format(thread.emails[0]?.sentAt ?? new Date, 'yyyy-MM-dd')
        if (!acc[date]) {
            acc[date] = []
        }

        acc[date].push(thread)
        return acc
    }, {} as Record<string, typeof threads>)

    return (
        <div className='max-w-full overflow-y-scroll no-scrollbar max-h-[calc(100vh-150px)]'>
            <div className='flex flex-col gap-2 p-4 pt-0'>
                {Object.entries(groupedThreads ?? {}).map(([date, threads]) => {
                    return (
                        <React.Fragment key={date}>
                            <div className='text-xs font-medium text-muted-foreground mt-5 first:mt-0'>
                                {date}
                            </div>
                            {threads.map(thread => {
                                return <button onClick={() => {setThreadId(thread.id)}} key={thread.id} className={cn('cursor-pointer flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all relative', {
                                    'bg-accent': thread.id === threadId
                                })}>
                                    <div className='flex flex-col w-full gap-2'>
                                        <div className='flex items-center'>
                                            <div className='flex items-center gap-2'>
                                                <div className='font-semibold'>
                                                    {thread.emails.at(-1)?.from.name}
                                                </div>
                                            </div>
                                            <div className={cn('ml-auto text-xs')}>
                                                {formatDistanceToNow(thread.emails.at(-1)?.sentAt ?? new Date(), { addSuffix: true })}
                                            </div>
                                        </div>
                                        <div className='text-xs font-medium'>{thread.subject}</div>
                                    </div>
                                    <div className='text-xs line-clamp-2 text-muted-foreground'
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(thread.emails.at(-1)?.bodySnippet ?? "", {
                                                USE_PROFILES: { html: true }
                                            })
                                        }}
                                    >

                                    </div>
                                    {thread.emails[0]?.sysLabels.length && (
                                        <div className='flex items-center gap-2'>
                                             {thread.emails[0]?.sysLabels.map(label =>{
                                                return <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
                                                    {label}
                                                </Badge>
                                             })}
                                        </div>
                                    )}
                                </button>
                            })}
                        </React.Fragment>)
                })}

            </div>
        </div>
    )
}

function getBadgeVariantFromLabel(label: string): ComponentProps<typeof Badge>['variant']{
    if(['work'].includes(label.toLowerCase())){
        return 'default'
    }
    else 'secondary'
}

export default ThreadList