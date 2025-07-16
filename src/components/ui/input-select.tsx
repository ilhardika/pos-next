"use client";

import * as React from "react";
import { ChevronDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface InputSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: string[];
  onAddOption?: (option: string) => void;
  onDeleteOption?: (option: string, force?: boolean) => Promise<void>;
  className?: string;
}

export function InputSelect({
  value,
  onValueChange,
  placeholder = "Pilih atau ketik...",
  options,
  onAddOption,
  onDeleteOption,
  className,
}: InputSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [isInputMode, setIsInputMode] = React.useState(false);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setInputValue(selectedValue);
    setIsOpen(false);
    setIsInputMode(false);
  };

  const handleInputSubmit = () => {
    if (inputValue.trim() && !options.includes(inputValue.trim())) {
      const newOption = inputValue.trim();
      onAddOption?.(newOption);
      onValueChange(newOption);
    } else if (inputValue.trim()) {
      onValueChange(inputValue.trim());
    }
    setIsOpen(false);
    setIsInputMode(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputSubmit();
    } else if (e.key === "Escape") {
      setIsInputMode(false);
      setInputValue(value);
    }
  };

  const handleDelete = async (optionToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteOption) {
      await onDeleteOption(optionToDelete);
      if (value === optionToDelete) {
        onValueChange("");
        setInputValue("");
      }
    }
  };

  if (isInputMode) {
    return (
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputSubmit}
          placeholder={placeholder}
          className={className}
          autoFocus
        />
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn("w-full justify-between", className)}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[200px]" align="start">
        {/* Add new option */}
        <DropdownMenuItem
          onSelect={() => {
            setIsInputMode(true);
            setIsOpen(false);
          }}
          className="text-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ketik baru...
        </DropdownMenuItem>

        {options.length > 0 && <DropdownMenuSeparator />}

        {/* Existing options */}
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => handleSelect(option)}
            className="flex items-center justify-between group"
          >
            <span className="flex-1">{option}</span>
            {onDeleteOption && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                onClick={(e) => handleDelete(option, e)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </DropdownMenuItem>
        ))}

        {options.length === 0 && (
          <DropdownMenuItem disabled>
            Belum ada pilihan tersimpan
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
