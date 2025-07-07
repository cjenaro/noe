import { createSignal, createEffect, For, Show } from "solid-js";
import { fetchFieldOptions, updateDOMField, type FieldKey, type SelectOption } from "../../utils/domOptions";

// Generic Autocomplete component
export function Autocomplete(props: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  allowCustom?: boolean;
  onOpen?: () => void;
  isLoading?: boolean;
}) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [searchTerm, setSearchTerm] = createSignal("");

  const filteredOptions = () => {
    const term = props.allowCustom ? props.value : searchTerm();
    if (!term) return props.options;
    return props.options.filter((option) =>
      option.label.toLowerCase().includes(term.toLowerCase()),
    );
  };

  const selectedOption = () => {
    return props.options.find((option) => option.value === props.value);
  };

  const displayValue = () => {
    if (props.allowCustom) return props.value;
    return selectedOption()?.label || "";
  };

  const handleSelect = (option: { value: string; label: string }) => {
    props.onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleOpen = () => {
    setIsOpen(true);
    props.onOpen?.();
  };

  return (
    <div class="relative">
      {props.allowCustom ? (
        <input
          type="text"
          value={displayValue()}
          onInput={(e) => props.onChange(e.currentTarget.value)}
          onFocus={handleOpen}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={props.placeholder || "Escribir o seleccionar..."}
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      ) : (
        <div
          class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white"
          onClick={handleOpen}
        >
          {displayValue() || props.placeholder || "Seleccionar..."}
        </div>
      )}

      <Show when={isOpen()}>
        <div class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          <Show when={props.isLoading}>
            <div class="px-2 py-1.5 text-xs text-gray-500 text-center">
              Cargando opciones...
            </div>
          </Show>
          <Show when={!props.isLoading}>
            {!props.allowCustom && (
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm()}
                onInput={(e) => setSearchTerm(e.currentTarget.value)}
                class="w-full px-2 py-1.5 text-xs border-b border-gray-200 focus:outline-none"
              />
            )}
            <For each={filteredOptions()}>
              {(option) => (
                <div
                  class="px-2 py-1.5 text-xs hover:bg-blue-50 cursor-pointer"
                  onMouseDown={() => handleSelect(option)}
                >
                  {option.label}
                </div>
              )}
            </For>
          </Show>
        </div>
      </Show>
    </div>
  );
}

// Base autocomplete component that fetches options from DOM
function DOMAutocomplete(props: {
  fieldKey: FieldKey;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  dependencies?: string[];
}) {
  const [options, setOptions] = createSignal<SelectOption[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [previousDependencies, setPreviousDependencies] = createSignal<string[]>([]);
  const [hasEverLoaded, setHasEverLoaded] = createSignal(false);

  const fetchOptions = async () => {
    setIsLoading(true);
    try {
      const fetchedOptions = await fetchFieldOptions(props.fieldKey);
      setOptions(fetchedOptions);
      setHasEverLoaded(true);
      if (props.dependencies) {
        setPreviousDependencies([...props.dependencies]);
      }
    } catch (error) {
      console.error(`Error fetching options for ${props.fieldKey}:`, error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    // Only fetch if we haven't loaded yet, or if we need to refetch due to dependencies
    if (!hasEverLoaded()) {
      fetchOptions();
    }
  };

  // Refetch when dependencies change (only if we've loaded before)
  createEffect(() => {
    if (props.dependencies && hasEverLoaded()) {
      const currentDeps = props.dependencies;
      const prevDeps = previousDependencies();
      
      // Check if dependencies have actually changed
      const hasChanged = currentDeps.length !== prevDeps.length || 
        currentDeps.some((dep, index) => dep !== prevDeps[index]);
      
      if (hasChanged && currentDeps.some(dep => dep && dep.trim() !== "")) {
        setTimeout(() => {
          fetchOptions();
        }, 500);
      }
    }
  });

  return (
    <Autocomplete
      value={props.value}
      onChange={props.onChange}
      options={options()}
      placeholder={props.placeholder}
      allowCustom={props.allowCustom}
      onOpen={handleOpen}
      isLoading={isLoading()}
    />
  );
}

// Specific autocomplete components
export function PuntoVentaAutocomplete(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const handleChange = async (value: string) => {
    props.onChange(value);
    // Immediately update the DOM field to trigger tipoComprobante options update
    if (value) {
      await updateDOMField("puntoVenta", value);
    }
  };

  return (
    <DOMAutocomplete
      fieldKey="puntoVenta"
      value={props.value}
      onChange={handleChange}
      placeholder={props.placeholder || "Seleccionar punto de venta..."}
    />
  );
}

export function TipoComprobanteAutocomplete(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  puntoVentaValue?: string;
}) {
  return (
    <DOMAutocomplete
      fieldKey="tipoComprobante"
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder || "Seleccionar tipo de comprobante..."}
      dependencies={[props.puntoVentaValue || ""]}
    />
  );
}

export function IdiomaAutocomplete(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <DOMAutocomplete
      fieldKey="idioma"
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder || "Seleccionar idioma..."}
    />
  );
}

export function ConceptoAutocomplete(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <DOMAutocomplete
      fieldKey="concepto"
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder || "Seleccionar concepto..."}
    />
  );
}

export function ActividadAutocomplete(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <DOMAutocomplete
      fieldKey="actividad"
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder || "Seleccionar actividad..."}
    />
  );
}

export function MonedaAutocomplete(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <DOMAutocomplete
      fieldKey="moneda"
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder || "Seleccionar moneda..."}
    />
  );
}

export function CountryAutocomplete(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <DOMAutocomplete
      fieldKey="country"
      value={props.value}
      onChange={props.onChange}
      placeholder={props.placeholder || "Seleccionar país..."}
    />
  );
}