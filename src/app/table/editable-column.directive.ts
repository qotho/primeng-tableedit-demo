import { EditableColumn, Table } from 'primeng/table';
import { DomHandler } from 'primeng/dom';
import { Directive, HostListener, ElementRef, NgZone, AfterViewInit, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';

@Directive({
    selector: '[appEditableColumn]'
})
export class EditableColumnDirective {

    @Output() paste = new EventEmitter();
  
    constructor(public dt: Table, private col: EditableColumn, public el: ElementRef, public zone: NgZone) {}

    // @HostListener('paste', ['$event'])
    // onPaste(event: ClipboardEvent) {
    //     let clipboardData = event.clipboardData;
    //     let pastedText = clipboardData.getData('text');

    //     if (pastedText && pastedText.indexOf('\t') >= 0) {
    //         this.paste.emit(pastedText);
    //         event.preventDefault();
    //     }
    // }

    @HostListener('keydown.arrowleft', ['$event'])
    onArrowLeftKeyDown(event: KeyboardEvent) {
        if (this.col.isEnabled()) {
            this.col.moveToPreviousCell(event);
            event.preventDefault();
        }
    }

    @HostListener('keydown.arrowright', ['$event'])
    onArrowRightKeyDown(event: KeyboardEvent) {
        if (this.col.isEnabled()) {
            this.col.moveToNextCell(event);
            event.preventDefault();
        }
    }

    @HostListener('keydown.arrowdown', ['$event'])
    onArrowDownKeyDown(event: KeyboardEvent) {
        if (this.col.isEnabled()) {
            this.moveToNextCellDown(event);
            event.preventDefault();
        }
    }

    @HostListener('keydown.arrowup', ['$event'])
    onArrowUpKeyDown(event: KeyboardEvent) {
        if (this.col.isEnabled()) {
            this.moveToNextCellUp(event);
            event.preventDefault();
        }
    }

    moveToNextCellUp(event: KeyboardEvent) {
        const currentCell = this.col.findCell(event.target);

        if (currentCell) {
            const targetCell = this.findEditableColumnAbove(currentCell);

            if (targetCell) {
                if (this.dt.isEditingCellValid()) {
                    this.col.closeEditingCell(true, event);
                }

                DomHandler.invokeElementMethod(event.target, 'blur');
                DomHandler.invokeElementMethod(targetCell, 'click');
                event.preventDefault();
            }
        }
    }

    moveToNextCellDown(event: KeyboardEvent) {
        const currentCell = this.col.findCell(event.target);

        if (currentCell) {
            const targetCell = this.findEditableColumnBelow(currentCell);

            if (targetCell) {
                if (this.dt.isEditingCellValid()) {
                    this.col.closeEditingCell(true, event);
                }

                DomHandler.invokeElementMethod(event.target, 'blur');
                DomHandler.invokeElementMethod(targetCell, 'click');
                event.preventDefault();
            }
        }
    }

    findEditableColumnIndex(cell: Element) {
        let prevCell = cell.previousElementSibling;
        let index = 0;

        while (prevCell) {
            index++;
            prevCell = prevCell.previousElementSibling;
        }

        return index;
    }

    findEditableColumnAbove(cell: Element) {
        const prevRow = cell.parentElement.previousElementSibling;

        if (prevRow) {
            const currentColIndex = this.findEditableColumnIndex(cell);
            const nextCell = prevRow.children[currentColIndex];

            if (nextCell) {
                if (DomHandler.hasClass(nextCell, 'ui-editable-column')) {
                    return nextCell;
                } else {
                    return this.col.findNextEditableColumn(nextCell);
                }
            } else {
                return null;
            }
        }
    }

    findEditableColumnBelow(cell: Element) {
        const nextRow = cell.parentElement.nextElementSibling;

        if (nextRow) {
            const currentColIndex = this.findEditableColumnIndex(cell);
            const nextCell = nextRow.children[currentColIndex];

            if (nextCell) {
                if (DomHandler.hasClass(nextCell, 'ui-editable-column')) {
                    return nextCell;
                } else {
                    return this.col.findNextEditableColumn(nextCell);
                }
            } else {
                return null;
            }
        }
    }
}
