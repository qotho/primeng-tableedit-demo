import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Car } from './car';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Country } from './country';

@Injectable()
export class CarService {
    brands: string[] = ['Audi', 'BMW', 'Fiat', 'Ford', 'Honda', 'Jaguar', 'Mercedes', 'Renault', 'Volvo', 'VW'];

    colors: string[] = ['Black', 'White', 'Red', 'Blue', 'Silver', 'Green', 'Yellow'];

    countries: Country[] = [
        {'name': 'Afghanistan', 'code': 'AF'},
        {'name': 'Åland Islands', 'code': 'AX'},
        {'name': 'Albania', 'code': 'AL'},
        {'name': 'Algeria', 'code': 'DZ'},
        {'name': 'American Samoa', 'code': 'AS'},
        {'name': 'Andorra', 'code': 'AD'},
        {'name': 'Angola', 'code': 'AO'},
        {'name': 'Anguilla', 'code': 'AI'},
        {'name': 'Antarctica', 'code': 'AQ'},
        {'name': 'Antigua and Barbuda', 'code': 'AG'},
        {'name': 'Argentina', 'code': 'AR'},
        {'name': 'Armenia', 'code': 'AM'},
        {'name': 'Aruba', 'code': 'AW'},
        {'name': 'Australia', 'code': 'AU'},
        {'name': 'Austria', 'code': 'AT'},
        {'name': 'Azerbaijan', 'code': 'AZ'},
        {'name': 'Bahamas', 'code': 'BS'},
        {'name': 'Bahrain', 'code': 'BH'},
        {'name': 'Bangladesh', 'code': 'BD'},
        {'name': 'Barbados', 'code': 'BB'},
        {'name': 'Belarus', 'code': 'BY'},
        {'name': 'Belgium', 'code': 'BE'},
        {'name': 'Belize', 'code': 'BZ'},
        {'name': 'Benin', 'code': 'BJ'},
        {'name': 'Bermuda', 'code': 'BM'}
    ];

    private virtualCars: Car[];

    constructor(private http: HttpClient) {
        this.virtualCars = Array.from({length: 20}).map(() => this.generateCar());
    }

    getCarsPage(first: number, last: number): Observable<HttpResponse<Car[]>> {
        return new Observable(subscriber => {
            // load data of required page
            const loadedCars = this.virtualCars.slice(first, last);
            const res = new HttpResponse<Car[]>({
                body: loadedCars,
                status: 200,
                headers: new HttpHeaders({'X-Total-Count': this.virtualCars.length + ''})
            });
            subscriber.next(res);
            subscriber.complete();
        });
        // Simulate calling a remote service
        // .pipe(delay<HttpResponse<Car[]>>(Math.random() * 1000 + 250));
    }

    getCarsSmall() {
        return this.http.get<any>('assets/cars-small.json')
        .toPromise()
        .then(res => <Car[]>res.data)
        .then(data => { return data; });
    }

    getCarsMedium() {
        return this.http.get<any>('assets/cars-medium.json')
        .toPromise()
        .then(res => <Car[]>res.data)
        .then(data => { return data; });
    }

    saveCar(car: Car): Observable<HttpResponse<Car>> {
        return new Observable(subscriber => {
            this.virtualCars.push(car);
            const res = new HttpResponse<Car>({
                body: car,
                status: 200,
                headers: new HttpHeaders({'X-Total-Count': this.virtualCars.length + ''})
            });
            subscriber.next(res);
            subscriber.complete();
        });
        // Simulate calling a remote service
        // .pipe(delay<HttpResponse<Car>>(Math.random() * 1000 + 250));
    }

    deleteCar(index: number): Observable<HttpResponse<void>> {
        return new Observable(subscriber => {
            this.virtualCars.splice(index, 1);
            const res = new HttpResponse<void>({
                status: 200,
                headers: new HttpHeaders({'X-Total-Count': this.virtualCars.length + ''})
            });
            subscriber.next(res);
            subscriber.complete();
        });
    }

    generateCar(): Car {
        return {
            vin: this.generateVin(),
            brand: this.generateBrand(),
            color: this.generateColor(),
            year: this.generateYear(),
            country: this.generateCountry()
        }
    }

    generateVin() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < 7; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    generateBrand(): string {
        return this.brands[Math.floor(Math.random() * Math.floor(10))];
    }

    generateColor(): string {
        return this.colors[Math.floor(Math.random() * Math.floor(7))];
    }

    generateYear(): number {
        return 2000 + Math.floor(Math.random() * Math.floor(19));
    }

    generateCountry(): string {
        return this.countries[Math.floor(Math.random() * Math.floor(this.countries.length))].name;
    }

}
