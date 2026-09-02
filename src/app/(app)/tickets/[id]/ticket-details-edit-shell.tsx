"use client";

import { createContext, useContext, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

const TicketEditModeContext = createContext({ isEditing: true });

export function useTicketEditMode() {
  return useContext(TicketEditModeContext);
}

export function TicketDetailsEditShell({
  canEdit,
  children,
}: {
  canEdit: boolean;
  children: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <TicketEditModeContext.Provider
      value={{ isEditing: canEdit ? isEditing : false }}
    >
      <div className="flex flex-col gap-6">
        {canEdit ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant={isEditing ? "secondary" : "outline"}
              onClick={() => setIsEditing((current) => !current)}
            >
              {isEditing ? (
                <Check data-icon="inline-start" />
              ) : (
                <Pencil data-icon="inline-start" />
              )}
              {isEditing ? "Done" : "Edit"}
            </Button>
          </div>
        ) : null}
        {children}
      </div>
    </TicketEditModeContext.Provider>
  );
}
