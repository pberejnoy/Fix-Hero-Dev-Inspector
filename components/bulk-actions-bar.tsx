"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Trash2, Download, CheckSquare, Square, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface BulkActionsBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onDelete: () => void
  onExport: (format: "markdown" | "json" | "csv" | "github") => void
  onCancel: () => void
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDelete,
  onExport,
  onCancel,
}: BulkActionsBarProps) {
  const { toast } = useToast()

  const handleDelete = () => {
    if (selectedCount === 0) {
      toast({
        title: "No issues selected",
        description: "Please select at least one issue to delete",
        variant: "destructive",
      })
      return
    }

    onDelete()
  }

  const handleExport = (format: "markdown" | "json" | "csv" | "github") => {
    if (selectedCount === 0) {
      toast({
        title: "No issues selected",
        description: "Please select at least one issue to export",
        variant: "destructive",
      })
      return
    }

    onExport(format)
  }

  return (
    <div className="flex items-center justify-between bg-orange-50 p-2 rounded-md">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onSelectAll}>
          {selectedCount === totalCount ? (
            <>
              <Square className="h-3 w-3 mr-1" />
              Deselect All
            </>
          ) : (
            <>
              <CheckSquare className="h-3 w-3 mr-1" />
              Select All
            </>
          )}
        </Button>
        <span className="text-xs text-gray-600">{selectedCount} selected</span>
      </div>
      <div className="flex gap-1">
        {selectedCount > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("markdown")}>Markdown</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("github")}>GitHub Issues</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
