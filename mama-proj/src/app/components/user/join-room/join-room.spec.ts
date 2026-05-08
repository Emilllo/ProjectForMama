import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinRoom } from './join-room';

describe('JoinGame', () => {
  let component: JoinRoom;
  let fixture: ComponentFixture<JoinRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinRoom],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinRoom);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
