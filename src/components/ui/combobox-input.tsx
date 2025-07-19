"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: string[];
  onAddOption?: (option: string) => void;
  onDeleteOption?: (option: string) => void;
  className?: string;
}

export function ComboboxInput({
  value,
  onValueChange,
  placeholder = "Pilih atau ketik...",
  options,
  onAddOption,
  onDeleteOption,
  className,
}: ComboboxInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    setInputValue("");
  };

  const handleAddNew = () => {
    if (inputValue.trim() && !options.includes(inputValue.trim())) {
      const newOption = inputValue.trim();
      onAddOption?.(newOption);
      onValueChange(newOption);
      setOpen(false);
      setInputValue("");
    }
  };

  const handleDelete = (optionToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteOption?.(optionToDelete);
    if (value === optionToDelete) {
      onValueChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      handleAddNew();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Cari atau ketik ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            {filteredOptions.length === 0 && inputValue.length === 0 && (
              <CommandEmpty>Tidak ada pilihan.</CommandEmpty>
            )}

            {filteredOptions.length === 0 && inputValue.length > 0 && (
              <CommandGroup>
                <CommandItem onSelect={handleAddNew} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah &quot;{inputValue}&quot;
                </CommandItem>
              </CommandGroup>
            )}

            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                    className="cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option}
                    </div>
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
                  </CommandItem>
                ))}

                {inputValue.trim() &&
                  !filteredOptions.some(
                    (option) =>
                      option.toLowerCase() === inputValue.toLowerCase()
                  ) && (
                    <CommandItem
                      onSelect={handleAddNew}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah &quot;{inputValue}&quot;
                    </CommandItem>
                  )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
