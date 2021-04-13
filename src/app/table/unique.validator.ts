import {
    ValidatorFn,
    AbstractControl,
    FormArray,
    FormGroup
} from "@angular/forms";

/*
    FIRST ATTEMPT

    Validator to enforce uniqueness in a FormArray.  This validator is applied
    to an individual field, but allows other fields to be specified for multifield
    uniqueness.

    PROBLEMS:
    1. Changes is the other fields aren't detected and therefore validation isn't triggered.
*/
export function uniqueValidator(otherFields: string[]): ValidatorFn {
    const subset = (obj: object, fields: string[]) => fields.reduce((a, b)=> (a[b] = obj[b], a), {});

    const rowsAreDifferent = (fields: string[], o1: object, o2: object) => fields.some(field => String(o1[field]) !== String(o2[field]));

    const rowsMatch = (fields: string[], o1: object, o2: object) => fields.every(field => String(o1[field]) === String(o2[field]));

    let getFormControlName = (control: AbstractControl) => {
        let controlName: string = '';

        if (control.parent) {
            for (var formControlName in control.parent.controls) {
                if (control.parent.controls[formControlName] == control) {
                    controlName = formControlName;
                    break;
                }
            }
        }
        return controlName;
    }

    let getParentFormArray = (control: AbstractControl) => {
        if (control.parent && !(control.parent instanceof FormArray)) {
            let parent = getParentFormArray(control.parent)
            return parent;
        }
        return control.parent;
    }

    var revalidateOtherRows = (rowsToRevalidate: AbstractControl[], controlValues: any[]) => {
        let timeOut = setTimeout(() => {
            rowsToRevalidate.forEach(t => {
                let isMatched = controlValues.filter(x => x == t.value)[0]

                if (!isMatched) {
                    t.updateValueAndValidity();
                }
            })
            clearTimeout(timeOut);
        }, 200)
    }

    const alreadyHasUniqueError = (formGroup: FormGroup, fieldName: string): boolean => {
        return formGroup.controls[fieldName].errors && formGroup.controls[fieldName].errors['unique']
    }

    return (control: AbstractControl): { [key: string]: any } => {
        if (control.value) {
            let formArray = getParentFormArray(control);
            let parentFormGroup = control.parent ? control.parent : undefined;
            let rowsToRevalidate: AbstractControl[] = [];
            let controlValues = [];

            if (formArray && parentFormGroup) {
                let fieldName = getFormControlName(control);
                let currentValue = control.value;
                const currentRowValue = parentFormGroup.value;
                // Update the row with the current value
                currentRowValue[fieldName] = currentValue;
                let uniqueKey = Array.from(new Set([fieldName, ...otherFields]));
                let isMatched = false;

                for (let formGroup of formArray.controls) {
                    if (formGroup != parentFormGroup) {
                        isMatched = rowsMatch(uniqueKey, formGroup.value, currentRowValue);
                        isMatched = (isMatched && !alreadyHasUniqueError(formGroup, fieldName))

                        if (alreadyHasUniqueError(formGroup, fieldName)) {
                            // Find the other control that matches this one
                            const matchedControl = formArray.controls.filter(t => {
                                t.controls[fieldName] != formGroup.controls[fieldName] && rowsMatch(uniqueKey, t.value, formGroup.value);
                            })[0];

                            if (!matchedControl) {
                                // No match, so update validation status
                                rowsToRevalidate.push(formGroup.controls[fieldName])
                            }
                        }
                        else {
                            controlValues.push(subset(formGroup.value, uniqueKey));
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
                    return {'unique': [control.value]};
                }
            }
        }
 
        return null;
    }
}