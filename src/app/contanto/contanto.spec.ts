import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Contanto } from './contanto';

describe('Contanto', () => {
  let component: Contanto;
  let fixture: ComponentFixture<Contanto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contanto],
    }).compileComponents();

    fixture = TestBed.createComponent(Contanto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
