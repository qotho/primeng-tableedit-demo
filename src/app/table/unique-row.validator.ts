import {
    ValidatorFn,
    AbstractControl,
    FormArray,
    FormGroup,
    ValidationErrors
} from "@angular/forms";

const ERROR_KEY = "unique";

function hasUniqueError(control: AbstractControl): boolean {
    return control.errors && control.errors[ERROR_KEY];
}

/*
    Meant to trigger uniqueRowValidator to revalidate rows
    when there is a change, like deleting one of the duplicate rows.
    This validator doesn't do any validation itself.

    NOTE: This may be getting called too often. Might be better to just call when the row is deleted.
*/
export function uniqueRowArrayChangeValidator(control: AbstractControl): ValidationErrors {
    const formArray = control as FormArray;
    formArray.controls.forEach(fg => {
        if (hasUniqueError(fg)) {
            fg.updateValueAndValidity({onlySelf: true})
        }
    });

    return null;
}

export function uniqueRowValidator(fieldNames: string[]): ValidatorFn {
    const subset = (obj: object, fields: string[]) => fields.reduce((a, b)=> (a[b] = obj[b], a), {});

    const rowsAreDifferent = (fields: string[], o1: object, o2: object) => fields.some(field => String(o1[field]) !== String(o2[field]));

    const rowsMatch = (fields: string[], o1: object, o2: object) => fields.every(field => String(o1[field]) === String(o2[field]));

    const getParentFormArray = (control: AbstractControl) => {
        if (control.parent && !(control.parent instanceof FormArray)) {
            return getParentFormArray(control.parent);
        }
        return control.parent;
    };

    const revalidateOtherRows = (rowsToRevalidate: FormGroup[], controlValues: any[]) => {
        const timeOut = setTimeout(() => {
            rowsToRevalidate.forEach(t => {
                let isMatched = controlValues.filter(x => rowsMatch(fieldNames, x, t.value))[0];

                if (!isMatched) {
                    t.updateValueAndValidity();
                }
            });
            clearTimeout(timeOut);
        }, 200);
    };

    return (control: FormGroup): { [key: string]: any } => {
        if (control.value) {
            const formArray = getParentFormArray(control);
            const rowsToRevalidate: FormGroup[] = [];
            const controlValues = [];

            if (formArray && control) {
                const currentRowValue = control.value;
                let isMatched = false;

                for (const formGroup of formArray.controls) {
                    if (formGroup != control) {
                        isMatched = rowsMatch(fieldNames, formGroup.value, currentRowValue);
                        isMatched = (isMatched && !hasUniqueError(formGroup))

                        if (hasUniqueError(formGroup)) {
                            // Find the other control that matches this one
                            const matchedControl = formArray.controls.filter((t: AbstractControl) => {
                                t != formGroup && rowsMatch(fieldNames, t.value, formGroup.value);
                            })[0];

                            if (!matchedControl) {
                                // No match, so update validation status
                                rowsToRevalidate.push(formGroup)
                            }
                        }
                        else {
                            controlValues.push(subset(formGroup.value, fieldNames));
                        }
                    }

                    if (isMatched) {
                        break;
                    }
                }

                if (rowsToRevalidate.length > 0) {
                    revalidateOtherRows(rowsToRevalidate, controlValues);
                }

                if (isMatched) {
                    const error = {};
                    error[ERROR_KEY] = [control.value];
                    return error;
                }
            }
        }
 
        return null;
    }
}
