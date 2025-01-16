import * as React from "react"
import {
  Dialog,
  DialogPortal,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface DottedDialogProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
}

export function DottedDialog({
  children,
  open,
  onOpenChange,
  title,
  description,
}: DottedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/10" />
          <DialogContent className="relative !fixed !translate-x-0 !translate-y-0 !top-[20px] !left-[10px] !right-[10px] !bottom-[50px] mx-auto w-[calc(100%-20px)] max-w-2xl bg-white border rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-70px)]">
            <DialogHeader className="flex-shrink-0 p-4 md:p-6 border-b">
              <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            {children}
          </DialogContent>
        </div>
      </DialogPortal>
    </Dialog>
  )
} 