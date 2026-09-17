import {
    ensureCsrfCookie,
    isNormalizedApiError,
    normalizeApiError,
} from '@/lib/http';
import type { LaravelValidationErrors } from '@/types/http';

export type FormErrors = Record<string, string>;

function firstErrorMessages(errors: LaravelValidationErrors): FormErrors {
    return Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
            field,
            messages[0] ?? '',
        ]),
    );
}

export type FormState<T extends Record<string, unknown>> = {
    readonly data: T;
    readonly errors: FormErrors;
    readonly processing: boolean;
    readonly status: string | null;
    readonly formError: string | null;
    readonly hasErrors: boolean;
    setField: <K extends keyof T>(key: K, value: T[K]) => void;
    clearErrors: () => void;
    reset: (...fields: Array<keyof T>) => void;
    setStatus: (value: string | null) => void;
    setFormError: (value: string | null) => void;
    submit: (
        action: (formData: T) => Promise<void | string | null>,
    ) => Promise<void>;
};

/**
 * Svelte 5 form helper for Fortify/auth mutations.
 * One instance per page — field spacing stays on the parent `grid gap-2` unit.
 */
export function createForm<T extends Record<string, unknown>>(
    initial: T,
): FormState<T> {
    const initialData = structuredClone(initial) as T;

    let data = $state(structuredClone(initial) as T);
    let errors = $state<FormErrors>({});
    let processing = $state(false);
    let status = $state<string | null>(null);
    let formError = $state<string | null>(null);

    return {
        get data() {
            return data;
        },
        get errors() {
            return errors;
        },
        get processing() {
            return processing;
        },
        get status() {
            return status;
        },
        get formError() {
            return formError;
        },
        get hasErrors() {
            return Object.keys(errors).length > 0 || formError !== null;
        },
        setField<K extends keyof T>(key: K, value: T[K]): void {
            data[key] = value;
        },
        clearErrors(): void {
            errors = {};
            formError = null;
        },
        reset(...fields: Array<keyof T>): void {
            if (fields.length === 0) {
                data = structuredClone(initialData) as T;

                return;
            }

            for (const field of fields) {
                data[field] = structuredClone(initialData[field]) as T[keyof T];
            }
        },
        setStatus(value: string | null): void {
            status = value;
        },
        setFormError(value: string | null): void {
            formError = value;
        },
        async submit(
            action: (formData: T) => Promise<void | string | null>,
        ): Promise<void> {
            if (processing) {
                return;
            }

            processing = true;
            errors = {};
            formError = null;
            status = null;

            try {
                const result = await action({ ...data });

                if (typeof result === 'string') {
                    status = result;
                }
            } catch (error) {
                const normalized = isNormalizedApiError(error)
                    ? error
                    : normalizeApiError(error);

                if (normalized.kind === 'csrf') {
                    try {
                        await ensureCsrfCookie();
                    } catch {
                        // Ignore secondary CSRF bootstrap failures.
                    }
                }

                if (normalized.kind === 'validation') {
                    errors = firstErrorMessages(normalized.errors);
                    formError = normalized.message;
                } else {
                    formError = normalized.message;
                }

                throw normalized;
            } finally {
                processing = false;
            }
        },
    };
}

export function fieldErrorId(field: string): string {
    return `${field}-error`;
}

export function fieldDescribedBy(
    field: string,
    errors: FormErrors,
): string | undefined {
    return errors[field] ? fieldErrorId(field) : undefined;
}
