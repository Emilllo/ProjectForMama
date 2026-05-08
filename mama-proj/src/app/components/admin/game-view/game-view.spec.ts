import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameView } from './game-view';

describe('GameView', () => {
  let component: GameView;
  let fixture: ComponentFixture<GameView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameView],
    }).compileComponents();

    fixture = TestBed.createComponent(GameView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
