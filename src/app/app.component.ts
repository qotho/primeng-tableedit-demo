import { Component, ViewChildren, QueryList, ElementRef, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import {Validators, FormControl, FormGroup, FormBuilder, FormArray} from '@angular/forms';
import { CarService } from './car.service';
import { Car } from './car';
import { SelectItem, MessageService, LazyLoadEvent, ConfirmationService } from 'primeng/api';
import { CountryService } from './country.service';
import { Country } from './country';
import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { Paginator } from 'primeng/paginator';
import { uniqueRowValidator, uniqueRowArrayChangeValidator } from './table/unique-row.validator';

const ITEMS_PER_PAGE = 10;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ],
  providers: [MessageService]
})
export class AppComponent implements OnInit, AfterViewInit {

  itemsPerPage = ITEMS_PER_PAGE;

  private cars: Car[];

  mainForm: FormGroup;

  filteredCountries: Country[];

  brands: SelectItem[];

  loading: boolean;

  firstRow = 0;

  totalItems = 0;

  cellBeingEdited: string;

  rowBeingEdited = -1;

  newRowAdded = false;

  lastSaved: any = {};

  @ViewChild(Paginator) private paginator: Paginator;

  // @ViewChildren('vin', {read: EditableColumn}) private editableColumns: QueryList<EditableColumn>;
  @ViewChildren('vin') private editableColumns: QueryList<ElementRef>;

  constructor(
    private fb: FormBuilder,
    private carService: CarService,
    private countryService: CountryService,
    private changeDetectorRef: ChangeDetectorRef,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.loading = true;
    const carForms = this.fb.array([], uniqueRowArrayChangeValidator);
    this.mainForm = this.fb.group({
      carForms: carForms
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
    this.loadPage(0);
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

  loadCars() {
    this.carService.getCarsSmall().then(cars => this.initCarForms(cars));
  }

  loadCarsLazy(event: LazyLoadEvent) {
    // In a real application, make a remote request to load data using state metadata from event:
    // event.first = First row offset
    // event.rows = Number of rows per page
    // event.sortField = Field name to sort with
    // event.sortOrder = Sort order as number, 1 for asc and -1 for dec
    // filters: FilterMetadata object having field as key and filter value, filter matchMode as value
    this.itemsPerPage = event.rows;
    this.loadPage(event.first);
  }

  loadPage(firstRow: number): void {
    this.loading = true;
    this.firstRow = firstRow;
    this.carService.getCarsPage(firstRow, (firstRow + this.itemsPerPage)).subscribe(
      (res: HttpResponse<Car[]>) => this.onLoadSuccess(res.body, res.headers),
      () => this.onError()
    );
  }

  save() {
    this.lastSaved = this.carForms.controls
      .filter(carForm => carForm.dirty)
      .map((carForm, index) => {
        const car = carForm.value;

        if (car.country) {
          car.country = car.country.name;
        }

        return car;
      });
  
      this.carService.saveCars(this.lastSaved).subscribe((res: HttpResponse<Car[]>) => {
        this.totalItems = Number(res.headers.get('X-Total-Count'));
        // If the user added new rows, reset back to the first page.
        // TODO How to tell if it is a new row?
        this.loadPage(0);
        this.messageService.add({severity: 'success', summary: 'Success', detail: 'Car changes saved'});
      });
  }

  get carForms(): FormArray {
    return this.mainForm.get('carForms') as FormArray;
  }

  initCarForms(cars: Car[]) {
    if (!cars || cars.length < 1) {
      this.addRow();
    } else {
      this.addCarForms(cars);
    }
  }

  addCarForms(cars: Car[]) {
      cars.forEach((car: Car, index: number) => {
        this.addCarForm(car);
      });
  }

  addCarForm(car: Car) {
    const newCarForm = this.newCarForm();
    this.updateCarForm(newCarForm, car);
    this.carForms.push(newCarForm);
  }

  parseBool(v: string){
    if (v === null || v === undefined) {
      return false;
    }
    
    switch (v.toLowerCase().trim()) {
        case "true": case "t": case "yes": case "y": case "1": return true;
        case "false": case "f": case "no": case "n": case "0": case null: return false;
        default: return Boolean(v);
    }
  }

  // additionalValidation(currentValue: any, indexOf: number, fieldName: string, row: any, formArrayValues: any[]): boolean {
  //   const uniqueKey = ['vin', 'brand']
  //   const different = (fields: string[], o1: any, o2: any) => fields.some(field => o1[field] !== o2[field]);
  //   row[fieldName] = currentValue;

  //   for (let otherRow of formArrayValues) {
  //     if (!different(uniqueKey, row, otherRow)) {
  //       return false;
  //     }
  //   }

  //   return true;
  // }

  newCarForm(data?: any[]): FormGroup {
    return this.fb.group({
      vin: [data && data.length >= 1 ? data[0] : '', [Validators.required, Validators.minLength(6)]],
      sold: [data && data.length >= 2 ? this.parseBool(data[1]) : ''],
      saleDate : [data && data.length >= 3 ? data[2] : ''],
      brand: [data && data.length >= 4 ? data[3] : '', Validators.required],
      country: [{name: data && data.length >= 5 ? data[4] : ''}, Validators.required],
      year: [data && data.length >= 6 ? data[5] : '', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      color: [data && data.length >= 7 ? data[6] : '', [Validators.required]],
      price : [''],
      isEditable: [true] // Only needed if we are using our own table
    }, 
    {validators: [uniqueRowValidator(['vin', 'brand', 'year'])]}
    );
  }

  updateCarForm(newCarForm: FormGroup, car: Car): void {
    newCarForm.patchValue({
      vin: car.vin,
      year: car.year,
      brand: car.brand,
      country: car.country ? {name: car.country} : null,
      color: car.color,
      sold: car.sold,
      price: car.price,
      saleDate : car.saleDate
    });
  }

  addRow(data?: any[]) {
    const newCar = this.newCarForm(data);
    newCar.markAsDirty();
    this.carForms.push(newCar);
    this.newRowAdded = true;
  }

  deleteRow(index: number) {
    // this.confirmationService.confirm({
    //   message: 'Are you sure you want to delete this item?',
    //   accept: () => {
        this.carService.deleteCar(index).subscribe((res: HttpResponse<void>) => {
          this.totalItems = Number(res.headers.get('X-Total-Count'));
          this.carForms.removeAt(index);
          //this.loadPage(this.firstRow);
          this.messageService.add({severity: 'success', summary: 'Success', detail: 'Car deleted'});

          // Update uniqueness validation on other rows
          // uniqueRowArrayChangeValidator(this.carForms);
        });
    //   }
    // });
  }

  editRow(group: FormGroup) {
    group.get('isEditable').setValue(true);
  }

  onFilterCountries(event) {
    const query = event.query;
    this.countryService.getCountries().then(countries => {
        this.filteredCountries = this.filterCountries(query, countries);
    });
  }

  filterCountries(query: string, countries: Country[]): Country[] {
    // In a real application, make a request to a remote url with the query and return filtered results, for demo we filter client side
    const filtered: any[] = [];

    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];

        if (country.name.toLowerCase().indexOf(query.toLowerCase()) === 0) {
            filtered.push(country);
        }
    }

    return filtered;
  }

  onCellEdit(event) {
    this.rowBeingEdited = event.index;
    this.cellBeingEdited = event.field;
    const field = this.carForms.get(String(event.index))?.get(event.field);

    if (field) {
      field.markAsDirty();
    }
  }

  onCellEditComplete(event) {
    if (
      event.originalEvent.key && event.originalEvent.key === 'Enter' &&
      this.cellBeingEdited === 'color' && this.rowBeingEdited === this.carForms.length - 1
    ) {
      this.addRow();
    }

    this.rowBeingEdited = -1;
    this.cellBeingEdited = null;
  }

  onPaste(event: ClipboardEvent) {
    this.loading = true;

    try {
      let clipboardData = event.clipboardData;
      let pastedText = clipboardData.getData('text');

      if (pastedText && pastedText.search(/[\t\n]/) >= 0) {
        let rows = pastedText.split(/\r*\n+/);
        rows.forEach((row, index) => {
          if (row) {
            this.addRow(row.split('\t'));
          }
        });
        this.totalItems = this.totalItems + rows.length;
        this.firstRow = 0;
        event.preventDefault();
      }
    } finally {
      this.loading = false;
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (
      event.key === 'Tab' && !event.shiftKey && this.cellBeingEdited === 'color' &&
      this.rowBeingEdited === this.carForms.controls.length - 1
    ) {
      this.addRow();
    }
  }

  protected onLoadSuccess(data: Car[] | null, headers: HttpHeaders): void {
    this.totalItems = Number(headers.get('X-Total-Count'));
    // populate page of cars
    this.cars = data || [];
    this.carForms.clear();
    this.addCarForms(this.cars);
    this.loading = false;
  }

  protected onError(): void {
  }

}
