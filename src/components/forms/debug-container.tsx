import { useForm } from 'react-hook-form'

type FormDebugContainerProps = {
  form: ReturnType<typeof useForm<any>>
}

/*
 * Dev only component to display form state and errors
 * to help you debug your form.
 */
export const FormDebugContainer = ({ form }: FormDebugContainerProps) => {
  const formErrors = form.formState.errors
  return (
    <div className="mt-2 rounded-md bg-black py-4">
      <div className="no-scrollbar mx-auto max-h-[400px] max-w-[450px] overflow-auto bg-black p-4 text-white">
        <pre className="text-left">
          {JSON.stringify({ watch: form.watch(), errors: formErrors }, null, 2)}
        </pre>
      </div>
    </div>
  )
}
