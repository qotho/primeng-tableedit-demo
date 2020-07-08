import { Component, ViewChildren, QueryList, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import {Validators, FormControl, FormGroup, FormBuilder, FormArray} from '@angular/forms';
import { CarService } from './carservice';
import { Car } from './car';
import { SelectItem, MessageService } from 'primeng/api';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ],
  providers: [MessageService],
})
export class AppComponent implements OnInit, AfterViewInit {
    mainForm: FormGroup;

    cars: Car[];

    brands: SelectItem[];

    cellBeingEdited: string;

    rowBeingEdited = -1;

    newRowAdded = false;

    // @ViewChildren('vin', {read: EditableColumn}) private editableColumns: QueryList<EditableColumn>;
    @ViewChildren('vin') private editableColumns: QueryList<ElementRef>;

    constructor(
      private fb: FormBuilder,
      private carService: CarService,
      private messageService: MessageService
    ) { }

    ngOnInit() {
      this.mainForm = this.fb.group({
        carForms: this.fb.array([])
      });
      this.carService.getCarsSmall().then(
        cars => {
          this.cars = cars;
          if (!cars || cars.length < 1) {
            this.addRow();
          } else {
            cars.forEach((car: Car, index: number) => {
              const newCarForm = this.newCarForm();
              this.updateCarForm(newCarForm, car);
              // this.cars1.push({'brand': '', 'year': 2020, 'color': '', 'vin': '', 'sold': false});
              this.carForms.push(newCarForm);
            });
          }
        });

        this.brands = [
            {label: 'Audi', value: 'Audi'},
            {label: 'BMW', value: 'BMW'},
            {label: 'Fiat', value: 'Fiat'},
            {label: 'Ford', value: 'Ford'},
            {label: 'Honda', value: 'Honda'},
            {label: 'Jaguar', value: 'Jaguar'},
            {label: 'Mercedes', value: 'Mercedes'},
            {label: 'Renault', value: 'Renault'},
            {label: 'VW', value: 'VW'},
            {label: 'Volvo', value: 'Volvo'}
        ];
    }

    ngAfterViewInit() {
      // this.carForms = this.mainForm.get('carForms') as FormArray;
      this.editableColumns.changes.subscribe(list => {
        if (this.newRowAdded) {
            setTimeout(() => {
              list.last.nativeElement.click();
            });
            this.newRowAdded = false;
          }
      });
    }

    get carForms(): FormArray {
      return this.mainForm.get('carForms') as FormArray;
    }

    newCarForm(): FormGroup {
      return this.fb.group({
        vin: ['', [Validators.required, Validators.minLength(6)]],
        year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
        brand: ['', Validators.required],
        color: ['', [Validators.required]],
        sold: [''],
        price : [''],
        saleDate : [''],
        isEditable: [true]
      });
    }

    updateCarForm(newCarForm: FormGroup, car: Car): void {
      newCarForm.patchValue({
        vin: car.vin,
        year: car.year,
        brand: car.brand,
        color: car.color,
        sold: car.sold,
        price: car.price,
        saleDate : car.saleDate
      });
    }

    onCellEdit(event) {
      this.rowBeingEdited = event.index;
      this.cellBeingEdited = event.field;
      //const car = this.cars[event.index];
      //const patched = {};
      //patched[event.field] = car[event.field];
      //this.mainForm.patchValue(patched);
      // this.mainForm.markAsPending();
      // this.mainForm.markAsDirty();
    }

    onCellEditComplete(event) {
      // const car = this.cars[this.rowBeingEdited];
      // car[event.field] = this.mainForm.get(event.field).value;

      if (
        event.originalEvent.key && event.originalEvent.key === 'Enter' &&
        this.cellBeingEdited === 'color' && this.rowBeingEdited === this.cars.length - 1
      ) {
        this.addRow();
      }

      this.rowBeingEdited = -1;
      this.cellBeingEdited = null;
 }

    addRow() {
      this.carForms.push(this.newCarForm());
      // this.cars1.push({'brand': '', 'year': 2020, 'color': '', 'vin': '', 'sold': false});
      this.newRowAdded = true;
    }

    deleteRow(index: number) {
      this.carForms.removeAt(index);
      // this.cars1.splice(rowIndex, 1);
    }

    editRow(group: FormGroup) {
      group.get('isEditable').setValue(true);
    }

    onKeyDown(event: KeyboardEvent) {
      if (
        event.key === 'Tab' && !event.shiftKey && this.cellBeingEdited === 'color' &&
        this.rowBeingEdited === this.carForms.controls.length - 1
      ) {
        this.addRow();
      }
    }

    toggleSold(event, car: Car) {
      car.sold = event.checked;
    }
}
