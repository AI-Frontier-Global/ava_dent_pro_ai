import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Invoice, InvoiceItem, InvoicePayment, PaymentMethod } from '../types';
import type { DbInvoice, DbInvoiceItem, DbInvoicePayment } from './db-types';
import { mapInvoice, uid } from './db-types';

type ClinicSettingsRef = { taxRate?: number };

export function useBillingStore(clinicSettingsRef: React.MutableRefObject<ClinicSettingsRef | null>) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const loadInvoices = useCallback(async () => {
    const [iRes, itRes] = await Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('invoice_items').select('*'),
    ]);
    if (iRes.error) throw iRes.error;
    if (itRes.error) throw itRes.error;
    const dbInvoices = iRes.data as DbInvoice[];
    const dbItems = itRes.data as DbInvoiceItem[];
    setInvoices(
      dbInvoices.map((inv) =>
        mapInvoice(
          inv,
          dbItems
            .filter((it) => it.invoice_id === inv.id)
            .map((it) => ({
              id: it.id,
              serviceName: it.service_name,
              price: Number(it.price),
              qty: it.qty,
            })),
        ),
      ),
    );
  }, []);

  const addInvoice = useCallback(async (inv: Omit<Invoice, 'id' | 'createdAt' | 'taxRate'>) => {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        patient_id: inv.patientId,
        patient_name: inv.patientName,
        tax_rate: clinicSettingsRef.current?.taxRate ?? 0.16,
        cliq_link: null,
      })
      .select()
      .single();
    if (error) throw error;

    const newInvId = (data as DbInvoice).id;
    const rows = inv.items.map((it) => ({
      invoice_id: newInvId,
      service_name: it.serviceName,
      price: it.price,
      qty: it.qty,
    }));
    const { error: itemError } = await supabase.from('invoice_items').insert(rows);
    if (itemError) throw itemError;

    const newInv = mapInvoice(data as DbInvoice, inv.items);
    setInvoices((prev) => [newInv, ...prev]);
    return newInv;
  }, [clinicSettingsRef]);

  const generateCliqLink = useCallback(async (id: string) => {
    const link = 'https://cliq.pay/' + id + '/' + uid();
    const { error } = await supabase.from('invoices').update({ cliq_link: link }).eq('id', id);
    if (error) throw error;
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, cliqLink: link } : inv)));
    return link;
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw error;
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateInvoice = useCallback(async (id: string, items: InvoiceItem[]) => {
    const { error: delError } = await supabase.from('invoice_items').delete().eq('invoice_id', id);
    if (delError) throw delError;
    if (items.length > 0) {
      const rows = items.map((it) => ({
        invoice_id: id,
        service_name: it.serviceName,
        price: it.price,
        qty: it.qty,
      }));
      const { error: itemError } = await supabase.from('invoice_items').insert(rows);
      if (itemError) throw itemError;
    }
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, items } : inv)),
    );
  }, []);

  const loadInvoicePayments = useCallback(async (invoiceId: string): Promise<InvoicePayment[]> => {
    const { data, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as DbInvoicePayment[]).map((r) => ({
      id: r.id,
      invoiceId: r.invoice_id,
      amount: Number(r.amount),
      method: r.method,
      note: r.note ?? undefined,
      createdAt: r.created_at,
    }));
  }, []);

  const addInvoicePayment = useCallback(
    async (input: {
      invoiceId: string;
      amount: number;
      method: PaymentMethod;
      note?: string;
    }): Promise<InvoicePayment> => {
      const { data, error } = await supabase
        .from('invoice_payments')
        .insert({
          invoice_id: input.invoiceId,
          amount: input.amount,
          method: input.method,
          note: input.note ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      const r = data as DbInvoicePayment;
      return {
        id: r.id,
        invoiceId: r.invoice_id,
        amount: Number(r.amount),
        method: r.method,
        note: r.note ?? undefined,
        createdAt: r.created_at,
      };
    },
    [],
  );

  const deleteInvoicePayment = useCallback(async (id: string) => {
    const { error } = await supabase.from('invoice_payments').delete().eq('id', id);
    if (error) throw error;
  }, []);

  const removeByPatient = useCallback((patientId: string) => {
    setInvoices((prev) => prev.filter((i) => i.patientId !== patientId));
  }, []);

  return {
    invoices,
    setInvoices,
    loadInvoices,
    addInvoice,
    generateCliqLink,
    deleteInvoice,
    updateInvoice,
    loadInvoicePayments,
    addInvoicePayment,
    deleteInvoicePayment,
    removeByPatient,
  };
}

export type BillingStore = ReturnType<typeof useBillingStore>;
