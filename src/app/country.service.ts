import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Country } from "./country";

@Injectable()
export class CountryService {

    constructor(private http: HttpClient) {}

    getCountries() {
        return this.http.get<any>('assets/countries.json')
                    .toPromise()
                    .then(res => <Country[]> res.data)
                    .then(data => { return data; });
    }
}