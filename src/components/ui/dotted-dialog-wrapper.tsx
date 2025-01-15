import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dotted-dialog"

interface DottedDialogProps extends React.PropsWithChildren {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
}

export function DottedDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DottedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        <DialogContent className="!fixed !translate-x-0 !translate-y-0 !top-[50px] !left-0 !right-0 mx-auto w-full max-w-2xl bg-white border rounded-lg shadow-lg h-[calc(100vh-100px)] flex flex-col">
          <DialogHeader className="flex-shrink-0 p-4 md:p-6 border-b">
            <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
            {description && <DialogDescription className="mt-1.5">{description}</DialogDescription>}
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </DialogContent>
      </div>
    </Dialog>
  )
} 