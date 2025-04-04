'use client'

import React from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import Text from "@tiptap/extension-text";
import StarterKit from '@tiptap/starter-kit'

type Props = {}

const EmailEditor = (props: Props) => {
    const [value, setValue] = React.useState<string>('')


    const CustomText = Text.extend({
        addKeyboardShortcuts() {
            return{
                'Meta-j': () => {
                    console.log('Meta-j')
                    return true
                }
            }
        }
    })
    
    const editor = useEditor({
        autofocus: false,
        extensions: [StarterKit],
        onUpdate: ({ editor }) => {
            setValue(editor.getHTML())
        }
    })

  return (
    <div>
        <div className='prose w-full px-4'>
            <EditorContent editor={editor} value={value} />
        </div>
    </div>
  )
}

export default EmailEditor