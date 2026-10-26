import { describe, expect, it } from 'vitest';
import { CAR_EVENT_TO_STATUS, CAR_REVIEWER_DECISION_TO_STATUS, CAR_TRANSITIONS, RFQ_TRANSITIONS, SUPPLIER_CAR_TRANSITION_EVENTS, SUPPLIER_RFQ_TRANSITION_EVENTS, TRANSITION_TO_STATUS } from './index';

describe('RFQ transition configuration', () => {
  it('only defines targets for supported transition events', () => {
    const definedEvents = new Set(Object.values(RFQ_TRANSITIONS).flat());
    for (const event of definedEvents) {
      expect(TRANSITION_TO_STATUS[event]).toBeTruthy();
    }
  });

  it('does not allow transitions from terminal states', () => {
    expect(RFQ_TRANSITIONS.REJECTED).toEqual([]);
    expect(RFQ_TRANSITIONS.IN_PRODUCTION).toEqual([]);
    expect(RFQ_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it('requires a submitted RFQ to enter review before a decision', () => {
    expect(RFQ_TRANSITIONS.SUBMITTED).toContain('START_REVIEW');
    expect(RFQ_TRANSITIONS.SUBMITTED).not.toContain('APPROVE');
    expect(RFQ_TRANSITIONS.UNDER_REVIEW).toContain('APPROVE');
    expect(RFQ_TRANSITIONS.UNDER_REVIEW).toContain('REJECT');
  });
});


describe('CAR transition configuration', () => {
  it('maps every allowed event to a status', () => {
    for (const event of new Set(Object.values(CAR_TRANSITIONS).flat())) {
      expect(CAR_EVENT_TO_STATUS[event]).toBeTruthy();
    }
  });

  it('prevents closing a CAR before verification is pending', () => {
    expect(CAR_TRANSITIONS.OPEN).not.toContain('CLOSE');
    expect(CAR_TRANSITIONS.ROOT_CAUSE_IDENTIFIED).not.toContain('CLOSE');
    expect(CAR_TRANSITIONS.ACTION_PLAN_SUBMITTED).not.toContain('CLOSE');
    expect(CAR_TRANSITIONS.VERIFICATION_PENDING).toContain('CLOSE');
  });

  it('does not allow transitions from closed CARs', () => {
    expect(CAR_TRANSITIONS.CLOSED).toEqual([]);
  });
});


describe('supplier-facing transition permissions', () => {
  it('does not let supplier users approve or reject their own RFQs', () => {
    expect(SUPPLIER_RFQ_TRANSITION_EVENTS).toEqual(['SUBMIT', 'CANCEL']);
    expect(SUPPLIER_RFQ_TRANSITION_EVENTS).not.toContain('APPROVE');
    expect(SUPPLIER_RFQ_TRANSITION_EVENTS).not.toContain('REJECT');
    expect(SUPPLIER_RFQ_TRANSITION_EVENTS).not.toContain('START_REVIEW');
  });

  it('does not let supplier users close their own CARs', () => {
    expect(SUPPLIER_CAR_TRANSITION_EVENTS).not.toContain('CLOSE');
    expect(SUPPLIER_CAR_TRANSITION_EVENTS).toContain('REQUEST_VERIFICATION');
  });
});


describe('internal CAR reviewer decisions', () => {
  it('allows only approve-and-close or return-to-supplier outcomes', () => {
    expect(CAR_REVIEWER_DECISION_TO_STATUS.APPROVE).toBe('CLOSED');
    expect(CAR_REVIEWER_DECISION_TO_STATUS.REQUEST_CHANGES).toBe('ACTION_PLAN_SUBMITTED');
  });

  it('keeps approval out of supplier-facing transitions', () => {
    expect(SUPPLIER_CAR_TRANSITION_EVENTS).not.toContain('CLOSE');
    expect(SUPPLIER_CAR_TRANSITION_EVENTS).not.toContain('APPROVE');
  });
});
