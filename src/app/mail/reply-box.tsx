'use client'

import React from 'react'
import EmailEditor from './email-editor'
import { api, RouterOutputs } from '@/trpc/react'
import useThreads from '@/hooks/user-threads'
import { toast } from "sonner"

const ReplyBox = () => {
  const {threadId, accountId} = useThreads()
  const {data: replyDetails} = api.account.getReplyDetails.useQuery({
    threadId: threadId ?? "",
    accountId
  })

  if(!replyDetails) return null

  return <Component replyDetails={replyDetails} />
  
}

const Component = ({replyDetails}: {replyDetails: RouterOutputs['account']['getReplyDetails']}) => {
  const {threadId, accountId} = useThreads()

  const [subject, setSubject] = React.useState(replyDetails.subject.startsWith('Re:') ? replyDetails.subject : `Re: ${replyDetails.subject}`)
  const [toValues, setToValues] = React.useState<{ label: string, value: string }[]>(replyDetails.to.map(e => ({label: e.address, value: e.address})))
  const [ccValues, setCcValues] = React.useState<{ label: string, value: string }[]>(replyDetails.cc.map(e => ({label: e.address, value: e.address})))

  React.useEffect(() => {
    if(!threadId || !replyDetails) return

    if(!replyDetails.subject.startsWith('Re:')) {
      setSubject(`Re: ${replyDetails.subject}`)
    } else {
      setSubject(replyDetails.subject)
    }

    setToValues(replyDetails.to.map(e => ({label: e.address, value: e.address})))
    setCcValues(replyDetails.cc.map(e => ({label: e.address, value: e.address})))


  }, [threadId, replyDetails])

  const sendEmail = api.account.sendEmail.useMutation()


  const  handleSend = async (value: string) => {
    if(!replyDetails) return
    sendEmail.mutate({
      accountId,
      threadId: threadId ?? undefined,
      body: value,
      subject,
      from: replyDetails.from,
      to: replyDetails.to.map(to => ({address: to.address, name: to.name ?? ""})),
      cc: replyDetails.cc.map(to => ({address: to.address, name: to.name ?? ""})),
      replyTo: replyDetails.from,
      inReplyTo: replyDetails.id

    }, {
      onSuccess: () => {
        toast.success('Email Sent!')
      },
      onError: (error) => {
        toast.error('Error sending email')
        console.log(error)
      }
    })
  }

  return (
    <EmailEditor 
      subject={subject}
      setSubject={setSubject}
      toValues={toValues}
      setToValues={setToValues}
      ccValues={ccValues}
      setCcValues={setCcValues}
      to={replyDetails.to.map(e => e.address)}
      handleSend={handleSend}
      isSending={sendEmail.isPending}
      defaultToolbarExpanded={true}

    />
  )
}



export default ReplyBox