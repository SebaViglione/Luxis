'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface BotonEnviarProps extends React.ComponentProps<typeof Button> {
  textoPendiente: string;
}

/** Botón submit que muestra un mensaje de progreso mientras corre la server action del form. */
export function BotonEnviar({ children, textoPendiente, disabled, ...props }: BotonEnviarProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Spinner />
          {textoPendiente}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
