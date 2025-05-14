"use client";

import React, { FormEvent, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { BackgroundBeams } from "../ui/beams";
import {
  X,
  Upload,
} from "lucide-react";
import BulkUploadModal from "./BulkUploadModal";
import { Employee } from "@/lib/interfaces";
import { useAuth } from "@/context/authContext";

export interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee?: (wallet: string, employee: Employee) => void;
  editEmployee?: Employee | null;
  onUploadSuccess: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onAddEmployee,
  onUpdateEmployee,
  editEmployee,
  onUploadSuccess,
}) => {
  const { user } = useAuth();
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Employee>>({});
  const [formData, setFormData] = useState<Employee>({
    name: "",
    designation: "",
    wallet: "",
    salary: "",
    email: "",
    company: user?.company?.toString() || "",
  });
  const isEditing = Boolean(editEmployee);

  useEffect(() => {
    if (editEmployee) {
      setFormData({
        name: editEmployee.name,
        designation: editEmployee.designation,
        wallet: editEmployee.wallet,
        salary: editEmployee.salary,
        email: editEmployee.email || "",
        company: user?.company?.toString() || "",
      });
    } else if (isOpen) {
      setFormData({
        name: "",
        designation: "",
        wallet: "",
        salary: "",
        email: "",
        company: user?.company?.toString() || "",
      });
      setErrors({});
    }
  }, [editEmployee, user, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value, company: user?.company?.toString() || "" }));
    if (errors[name as keyof Employee]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Partial<Employee> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.toString().trim()) {
        newErrors[key as keyof Employee] = "This field is required";
      }
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    if (isEditing && onUpdateEmployee) {
      onUpdateEmployee(editEmployee!.wallet, formData);
    } else {
      onAddEmployee(formData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 w-screen h-screen bg-black/50 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="flex relative w-full h-full items-center justify-center bg-white/90 dark:bg-black/90 md:p-4"
          >
            <BackgroundBeams />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="shadow-input relative w-full md:max-w-4xl rounded-none bg-white md:rounded-xl p-4 md:p-8 dark:bg-black"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                  {isEditing ? "Edit Employee" : "Add New Employee"}
                </h2>
                <button onClick={onClose} aria-label="Close">
                  <X className="text-neutral-500 hover:text-red-500" />
                </button>
              </div>

              <form className="my-8" onSubmit={handleSubmit}>
                {/* Name & Company */}
                <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                  <LabelInputContainer>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={cn(errors.name && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                  </LabelInputContainer>
                  <LabelInputContainer>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      value={user?.company?.toString() || ""}
                      disabled
                      className="opacity-60 cursor-not-allowed"
                    />
                  </LabelInputContainer>
                </div>

                {/* Designation & Email */}
                <div className="mb-4 flex flex-col space-y-4">
                  <LabelInputContainer>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      name="designation"
                      placeholder="Senior Developer"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className={cn(errors.designation && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.designation && <p className="text-sm text-red-600 mt-1">{errors.designation}</p>}
                  </LabelInputContainer>
                  <LabelInputContainer>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@abc.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={cn(errors.email && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <Label htmlFor="wallet">Wallet Address</Label>
                    <Input
                      id="wallet"
                      name="wallet"
                      placeholder="0x..."
                      value={formData.wallet}
                      onChange={handleInputChange}
                      className={cn(errors.wallet && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.wallet && <p className="text-sm text-red-600 mt-1">{errors.wallet}</p>}
                  </LabelInputContainer>
                  <LabelInputContainer>
                    <Label htmlFor="salary">Salary (USD)</Label>
                    <Input
                      id="salary"
                      name="salary"
                      placeholder="5000"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className={cn(errors.salary && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.salary && <p className="text-sm text-red-600 mt-1">{errors.salary}</p>}
                  </LabelInputContainer>
                </div>

                <div className="flex flex-col space-y-4">
                  <div className="flex md:flex-row flex-col md:space-x-4 space-y-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    >
                      Cancel
                      <BottomGradient />
                    </button>
                    <button
                      type="submit"
                      className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    >
                      {isEditing ? "Update Employee" : "Add Employee"}
                      <BottomGradient />
                    </button>
                  </div>
                  <div className="w-full flex items-center justify-center">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsBulkUploadOpen(true)}
                        className="group/btn shadow-input relative flex h-10 w-80 items-center justify-center space-x-2 rounded-md bg-gray-800 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
                      >
                        <Upload className="h-4 w-4 text-neutral-200 dark:text-neutral-300" />
                        <span className="text-sm text-neutral-200 dark:text-neutral-300">Bulk Upload</span>
                        <BottomGradient />
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
          <BulkUploadModal
            isOpen={isBulkUploadOpen}
            onClose={() => setIsBulkUploadOpen(false)}
            onUploadSuccess={onUploadSuccess}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>
);

export default AddEmployeeModal;
