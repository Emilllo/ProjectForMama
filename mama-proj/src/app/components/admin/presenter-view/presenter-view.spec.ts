import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresenterView } from './presenter-view';

describe('PresenterView', () => {
  let component: PresenterView;
  let fixture: ComponentFixture<PresenterView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresenterView],
    }).compileComponents();

    fixture = TestBed.createComponent(PresenterView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
