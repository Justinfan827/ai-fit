import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
    age: z.number()
      .min(1, {
        error: "Age must be at least 1.",
      })
      .max(120, {
        error: "Age must be less than 120.",
      }),
    heightValue: z.number().min(1, {
      error: "Height must be greater than 0.",
    }),
    heightUnit: z.enum(["cm", "in"], {
      error: "Please select a height unit.",
    }),
    heightFeet: z.number().min(1).max(8).optional(),
    heightInches: z.number().min(0).max(11).optional(),
    weightValue: z.number().min(1, {
      error: "Weight must be greater than 0.",
    }),
    weightUnit: z.enum(["kg", "lbs"], {
      error: "Please select a weight unit.",
    }),
  })
  .refine(
    (data) => {
      if (data.heightUnit === "in") {
        return data.heightFeet !== undefined && data.heightInches !== undefined
      }
      return true
    },
    {
      message: "Please provide both feet and inches",
      path: ["heightFeet"],
    }
  )

export type CreateClientFormType = z.infer<typeof CreateClientFormScham>

type NewClientFormProps = {
  formName: string
  onSubmit: (data: CreateClientFormType) => void
}

export function NewClientForm({ formName, onSubmit }: NewClientFormProps) {
  const initialState = {
    firstName: "",
    lastName: "",
    email: "",
    age: 25,
    heightValue: 170,
    heightUnit: "cm" as const,
    heightFeet: 5,
    heightInches: 7,
    weightValue: 70,
    weightUnit: "kg" as const,
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
        onSubmit={form.handleSubmit(onSubmit)}
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
                <Input max="120" min="1" type="number" {...field} />
              </FormControl>
              <FormDescription className="sr-only">
                Client&apos;s age in years
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Height Fields */}
        {form.watch("heightUnit") === "cm" ? (
          <div className="flex items-start gap-4">
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
            <FormField
              control={form.control}
              name="heightUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
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
        ) : (
          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="heightFeet"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Feet</FormLabel>
                  <FormControl>
                    <Input
                      max="8"
                      min="1"
                      step="0.01"
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
                <FormItem>
                  <FormLabel>Inches</FormLabel>
                  <FormControl>
                    <Input
                      max="11"
                      min="0"
                      step="0.01"
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
            <FormField
              control={form.control}
              name="heightUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height Unit</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
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
        )}

        {/* Weight Fields */}
        <div className="flex items-start gap-4">
          <FormField
            control={form.control}
            name="weightValue"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Weight</FormLabel>
                <FormControl>
                  <Input min="1" step="0.1" type="number" {...field} />
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
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
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
