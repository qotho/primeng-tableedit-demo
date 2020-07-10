import { CommonModule } from '@angular/common';
import { PrimeTemplate, SharedModule } from 'primeng/api';
import { PaginatorModule } from 'primeng/paginator';
import { NgModule } from '@angular/core';
import { EditableColumnDirective } from './editable-column.directive';

@NgModule({
    imports: [CommonModule],
    exports: [EditableColumnDirective],
    declarations: [EditableColumnDirective]
})
export class TableExModule { }
