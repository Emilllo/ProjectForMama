import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerSession } from './player-session';

describe('PlayerSession', () => {
  let component: PlayerSession;
  let fixture: ComponentFixture<PlayerSession>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerSession],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerSession);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
