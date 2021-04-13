import {
    ValidatorFn,
    AbstractControl,
    FormArray,
    FormGroup
} from "@angular/forms";

export function uniqueRowValidator(fieldNames: string[]): ValidatorFn {
    const subset = (obj: object, fields: string[]) => fields.reduce((a, b)=> (a[b] = obj[b], a), {});

    const rowsAreDifferent = (fields: string[], o1: object, o2: object) => fields.some(field => String(o1[field]) !== String(o2[field]));

    const rowsMatch = (fields: string[], o1: object, o2: object) => fields.every(field => String(o1[field]) === String(o2[field]));

    let getParentFormArray = (control: AbstractControl) => {
        if (control.parent && !(control.parent instanceof FormArray)) {
            let parent = getParentFormArray(control.parent)
            return parent;
        }
        return control.parent;
    }

    var revalidateOtherRows = (rowsToRevalidate: FormGroup[], controlValues: any[]) => {
        let timeOut = setTimeout(() => {
            rowsToRevalidate.forEach(t => {
                let isMatched = controlValues.filter(x => rowsMatch(fieldNames, x, t.value))[0];

                if (!isMatched) {
                    t.updateValueAndValidity();
                }
            })
            clearTimeout(timeOut);
        }, 200)
    }

    const alreadyHasUniqueError = (formGroup: FormGroup): boolean => {
        return formGroup.errors && formGroup.errors['unique']
    }

    return (control: FormGroup): { [key: string]: any } => {
        if (control.value) {
            let formArray = getParentFormArray(control);
            let rowsToRevalidate: FormGroup[] = [];
            let controlValues = [];

            if (formArray && control) {
                const currentRowValue = control.value;
                let isMatched = false;

                for (let formGroup of formArray.controls) {
                    if (formGroup != control) {
                        isMatched = rowsMatch(fieldNames, formGroup.value, currentRowValue);
                        isMatched = (isMatched && !alreadyHasUniqueError(formGroup))

                        if (alreadyHasUniqueError(formGroup)) {
                            // Find the other control that matches this one
                            const matchedControl = formArray.controls.filter(t => {
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
                    return {'unique': [control.value]};
                }
            }
        }
 
        return null;
    }
}