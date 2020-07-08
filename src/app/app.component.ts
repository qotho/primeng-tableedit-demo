import {Component, ViewChildren, QueryList, ElementRef} from '@angular/core';
import {Validators,FormControl,FormGroup,FormBuilder} from '@angular/forms';
import { CarService } from './carservice';
import { Car } from './car';
import { FilterUtils } from 'primeng/utils';
import { LazyLoadEvent } from 'primeng/api';
import { SelectItem } from 'primeng/api';
import {MessageService} from 'primeng/api';
import { EditableColumn } from 'primeng';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ],
  providers: [MessageService]
})
export class AppComponent { 
    carForm: FormGroup;

    cars1: Car[];

    cars2: Car[];

    brands: SelectItem[];

    clonedCars: { [s: string]: Car; } = {};

    cellBeingEdited: string;

    rowBeingEdited = -1;

    newRowAdded = false;

    //@ViewChildren('vin', {read: EditableColumn}) private editableColumns: QueryList<EditableColumn>;
    @ViewChildren('vin') private editableColumns: QueryList<ElementRef>;

    constructor(private fb: FormBuilder, private carService: CarService, private messageService: MessageService) { }

    ngOnInit() {
        this.carService.getCarsSmall().then(cars => this.cars1 = cars);
        this.carService.getCarsSmall().then(cars => this.cars2 = cars);

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


        this.carForm = this.fb.group({
            'vin': new FormControl('', [Validators.required, Validators.minLength(6)]),
            'year': new FormControl('', Validators.required),
            'brand': new FormControl('', Validators.required),
            'color': new FormControl('', [Validators.required]),
            'sold': new FormControl('', [Validators.required]), 
            'price' : new FormControl(''),
            'saleDate' : new FormControl('')
        });
    }

    ngAfterViewInit() {
      console.log(this.editableColumns);
      this.editableColumns.changes.subscribe(list => {
          console.log(list);
          //list.forEach(newCol => console.log(newCol));	
          if (this.newRowAdded) {
            setTimeout(() => {
              //list.last.onClick();
              list.last.nativeElement.click();
            });
            this.newRowAdded = false;
          }
      });
    }

    onNewRow(event) {

    }

    onCellEdit(event) {
      this.rowBeingEdited = event.index;
      this.cellBeingEdited = event.field;
      const car = this.cars1[event.index];
      const patched = {};
      patched[event.field] = car[event.field];
      this.carForm.patchValue(patched);
    }

    onCellEditComplete(event) {
      const car = this.cars1[this.rowBeingEdited];
      console.log(event);
      car[event.field] = this.carForm.get(event.field).value;

      if (
        event.originalEvent.key && event.originalEvent.key === 'Enter' &&
        this.cellBeingEdited == 'color' && this.rowBeingEdited == this.cars1.length - 1
      ) {
        this.addNewRow();
      }

      this.rowBeingEdited = -1;
      this.cellBeingEdited = null;
    }

    addNewRow() {
        this.cars1.push({"brand": "", "year": 2020, "color": "", "vin": "", "sold": false});
        this.newRowAdded = true;
        //console.log(this.editableColumns[this.cars1.length - 1]);
        //this.editableColumns[this.cars1.length - 1].nativeElement.click();
    }

    onKeyDown(event: KeyboardEvent) {
      //console.log(event);
      if (
        event.key === 'Tab' && this.cellBeingEdited == 'color' && 
        this.rowBeingEdited == this.cars1.length - 1
      ) {
        this.addNewRow();
      }
    }

    toggleSold(event, car: Car) {
      car.sold = event.checked;
    }
}
