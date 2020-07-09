import { Component, ViewChildren, QueryList, ElementRef, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import {Validators, FormControl, FormGroup, FormBuilder, FormArray} from '@angular/forms';
import { CarService } from './car.service';
import { Car } from './car';
import { SelectItem, MessageService, LazyLoadEvent } from 'primeng/api';
import { CountryService } from './country.service';
import { Country } from './country';
import { HttpResponse, HttpHeaders } from '@angular/common/http';

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

  // @ViewChildren('vin', {read: EditableColumn}) private editableColumns: QueryList<EditableColumn>;
  @ViewChildren('vin') private editableColumns: QueryList<ElementRef>;

  constructor(
    private fb: FormBuilder,
    private carService: CarService,
    private countryService: CountryService,
    private changeDetectorRef: ChangeDetectorRef,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.loading = true;
    const carForms = this.fb.array([]);
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
    this.loadPage(event.first);
  }

  loadPage(firstRow: number): void {
    this.loading = true;
    this.firstRow = firstRow;
    this.carService.getCarsPage(firstRow, (firstRow + this.itemsPerPage))
    .subscribe(
      (res: HttpResponse<Car[]>) => this.onSuccess(res.body, res.headers),
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

        this.carService.saveCar(car).subscribe((res: HttpResponse<Car>) => {
          this.totalItems = Number(res.headers.get('X-Total-Count'));
          this.messageService.add({severity: 'success', summary: 'Success', detail: 'Car changes saved'});
        });
        return car;
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

  newCarForm(): FormGroup {
    return this.fb.group({
      vin: ['', [Validators.required, Validators.minLength(6)]],
      year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      brand: ['', Validators.required],
      country: ['', Validators.required],
      color: ['', [Validators.required]],
      sold: [''],
      price : [''],
      saleDate : [''],
      isEditable: [true] // Only needed if we are using our own table
    });
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

  onFilterCountries(event) {
    const query = event.query;
    this.countryService.getCountries().then(countries => {
        this.filteredCountries = this.filterCountries(query, countries);
    });
  }

  filterCountries(query: string, countries: Country[]): Country[] {
    // In a real application, make a request to a remote url with the query and return filtered results, for demo we filter at client side
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
      this.cellBeingEdited === 'color' && this.rowBeingEdited === this.carForms.length - 1
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
    //this.carForms.removeAt(index);
    this.carService.deleteCar(index);
    this.loadPage(0);
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

  protected onSuccess(data: Car[] | null, headers: HttpHeaders): void {
    this.totalItems = Number(headers.get('X-Total-Count'));
    // populate page of cars
    this.cars = data || [];
    this.carForms.clear();
    this.addCarForms(this.cars);
    // Trigger change detection
    // this.mainForm.setControl('carForms', new FormArray(Object.values(this.carForms.controls)));
    this.loading = false;
  }

  protected onError(): void {
  }

}
