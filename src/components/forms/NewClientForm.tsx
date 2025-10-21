import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { CreateClientInput } from "@/actions/create-client"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const CreateClientFormScham = z
  .object({
    firstName: z.string().min(2, {
      error: "First name must be at least 2 characters.",
    }),
    lastName: z.string().min(2, {
      error: "Last name must be at least 2 characters.",
    }),
    email: z.email({
      error: "Please enter a valid email address.",
    }),
    age: z.string(),
    gender: z.enum(["male", "female"], {
      error: "Please select a gender.",
    }),
    heightValue: z.string(),
    heightUnit: z.enum(["cm", "in"], {
      error: "Please select a height unit.",
    }),
    heightFeet: z.string().optional(),
    heightInches: z.string().optional(),
    weightValue: z.string(),
    weightUnit: z.enum(["kg", "lbs"], {
      error: "Please select a weight unit.",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.heightUnit === "in") {
      const feet = Number.parseInt(data.heightFeet || "", 10)
      const inches = Number.parseFloat(data.heightInches || "")
      if (Number.isNaN(feet) || feet < 0 || feet > 8) {
        ctx.addIssue({
          code: "invalid_type",
          expected: "number",
          message: "Please provide a valid feet value",
          path: ["heightFeet"],
        })
      }
      if (Number.isNaN(inches) || inches < 0 || inches > 12) {
        ctx.addIssue({
          code: "invalid_type",
          expected: "number",
          message: "Please provide a valid value for inches",
          path: ["heightInches"],
        })
      }
    }
    if (data.heightUnit === "cm") {
      const height = Number.parseFloat(data.heightValue || "")
      if (Number.isNaN(height) || height < 1 || height > 300) {
        ctx.addIssue({
          code: "invalid_type",
          expected: "number",
          message: "Please provide a valid height value",
          path: ["heightValue"],
        })
      }
    }
    const age = Number.parseInt(data.age || "", 10)
    if (Number.isNaN(age) || age < 1 || age > 120) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "number",
        message: "Please provide a valid age value",
        path: ["age"],
      })
    }
    const weight = Number.parseFloat(data.weightValue || "")
    if (Number.isNaN(weight) || weight < 1 || weight > 1000) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "number",
        message: "Please provide a valid weight value",
        path: ["weightValue"],
      })
    }
  })

type CreateClientFormType = z.infer<typeof CreateClientFormScham>

type NewClientFormProps = {
  formName: string
  onSubmit: (data: CreateClientInput) => void
}

export function NewClientForm({ formName, onSubmit }: NewClientFormProps) {
  const initialState = {
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    gender: "male" as const,
    heightValue: "",
    heightUnit: "cm" as const,
    heightFeet: "",
    heightInches: "",
    weightValue: "",
    weightUnit: "kg" as const,
  }
  const _onSubmit = (data: CreateClientFormType) => {
    onSubmit({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      age: Number.parseInt(data.age || "", 10),
      gender: data.gender,
      weight: {
        ...(data.weightUnit === "lbs"
          ? {
              unit: "lbs",
              lbs: Number.parseFloat(data.weightValue || ""),
            }
          : {
              unit: "kg",
              kg: Number.parseFloat(data.weightValue || ""),
            }),
      },
      height: {
        ...(data.heightUnit === "in"
          ? {
              unit: "in",
              inches: Number.parseFloat(data.heightInches || ""),
              feet: Number.parseInt(data.heightFeet || "", 10),
            }
          : {
              unit: "cm",
              cm: Number.parseFloat(data.heightValue || ""),
            }),
      },
    })
  }
  const form = useForm<CreateClientFormType>({
    resolver: zodResolver(CreateClientFormScham),
    defaultValues: initialState,
  })

  return (
    <Form {...form}>
      {/* <FormDebugContainer form={form} /> */}
      <form
        className="space-y-6"
        id={formName}
        onSubmit={form.handleSubmit(_onSubmit)}
      >
        {/* First Name Field */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription className="sr-only">
                Client&apos;s first name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name Field */}
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription className="sr-only">
                Client&apos;s last name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription className="sr-only">
                Client&apos;s email address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Age Field */}
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input max="120" min="1" step="1" type="number" {...field} />
              </FormControl>
              <FormDescription className="sr-only">
                Client&apos;s age in years
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="">
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-start gap-4">
          {form.watch("heightUnit") === "cm" ? (
            <FormField
              control={form.control}
              name="heightValue"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Height</FormLabel>
                  <FormControl>
                    <Input min="1" step="0.01" type="number" {...field} />
                  </FormControl>
                  <FormDescription className="sr-only">
                    Client&apos;s height in centimeters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <>
              <FormField
                control={form.control}
                name="heightFeet"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Feet</FormLabel>
                    <FormControl>
                      <Input
                        max="8"
                        min="4"
                        step="1"
                        type="number"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="sr-only">
                      Client&apos;s height in feet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heightInches"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Inches</FormLabel>
                    <FormControl>
                      <Input
                        max="12"
                        min="0"
                        step="0.1"
                        type="number"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="sr-only">
                      Client&apos;s height in inches
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          <FormField
            control={form.control}
            name="heightUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                    <SelectItem value="in">Feet & Inches</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="sr-only">
                  Unit for height measurement
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Weight Fields */}
        <div className="flex items-start gap-4">
          <FormField
            control={form.control}
            name="weightValue"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Weight</FormLabel>
                <FormControl>
                  <Input
                    max="1000"
                    min="1"
                    step="0.01"
                    type="number"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="sr-only">
                  Client&apos;s weight in selected unit
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weightUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="sr-only">
                  Unit for weight measurement
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )
}
