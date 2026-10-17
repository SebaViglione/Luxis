import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface CampoFormularioProps extends Omit<React.ComponentProps<typeof Input>, 'name' | 'id'> {
  nombre: string;
  etiqueta: string;
  descripcion?: string;
  errores?: string[];
}

/** Input con label, descripción y errores de validación (para formularios con server actions). */
export function CampoFormulario({ nombre, etiqueta, descripcion, errores, ...props }: CampoFormularioProps) {
  const invalido = Boolean(errores?.length);
  return (
    <Field data-invalid={invalido || undefined}>
      <FieldLabel htmlFor={nombre}>{etiqueta}</FieldLabel>
      <Input id={nombre} name={nombre} aria-invalid={invalido || undefined} {...props} />
      {descripcion && !invalido && <FieldDescription>{descripcion}</FieldDescription>}
      <FieldError errors={errores?.map((message) => ({ message }))} />
    </Field>
  );
}
