import { Show } from "solid-js";
import { Autocomplete, ClientAutocomplete } from "./autocompletes";

interface StepThreeProps {
  isCollapsed: boolean;
  stepData: {
    paymentMethod: string;
    selectedClientId: string;
  };
  onFieldChange: (key: keyof StepThreeProps["stepData"], value: string) => void;
  onContinue: () => void;
}

export function StepThree(props: StepThreeProps) {
  return (
    <div class="mb-4 border border-green-200 rounded-md overflow-hidden">
      <div
        class={`p-3 cursor-pointer transition-colors ${props.isCollapsed ? "bg-green-100 border-green-200" : "bg-green-50"}`}
      >
        <h3
          class={`text-sm font-medium flex items-center justify-between ${props.isCollapsed ? "text-green-900" : "text-green-900"}`}
        >
          <span>
            {props.isCollapsed
              ? "✅ Paso 3: Completado"
              : "👥 Paso 3: Datos del Cliente"}
          </span>
          <span class="text-xs">{props.isCollapsed ? "▲" : "▼"}</span>
        </h3>
      </div>

      <Show when={!props.isCollapsed}>
        <div class="p-3 bg-green-50 border-t border-green-200">
          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <ClientAutocomplete
              value={props.stepData.selectedClientId}
              onChange={(v) => props.onFieldChange("selectedClientId", v)}
            />
          </div>

          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 mb-2">
              Forma de Pago (opcional)
            </label>
            <Autocomplete
              value={props.stepData.paymentMethod}
              onChange={(v) => props.onFieldChange("paymentMethod", v)}
              options={[
                "A percibir en USDT",
                "A percibir en BTC",
                "A percibir en ETH",
                "A percibir en USDC",
                "A percibir en DAI",
                "A percibir en ARS",
                "A percibir en USD",
                "A percibir en EUR",
                "Transferencia bancaria",
                "Efectivo",
                "Cheque",
                "Tarjeta de crédito",
                "Tarjeta de débito",
                "Mercado Pago",
                "PayPal",
                "Western Union",
                "MoneyGram",
              ].map((method) => ({ value: method, label: method }))}
              placeholder="Escribir o seleccionar forma de pago..."
              allowCustom={true}
            />
          </div>
          
          <button
            class="w-full px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={props.onContinue}
            disabled={!props.stepData.selectedClientId}
          >
            Continuar al Paso 4 →
          </button>
        </div>
      </Show>
    </div>
  );
}