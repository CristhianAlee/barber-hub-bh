// ── Date helpers (local-time, no UTC offset drift)
function localDate(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthDay(day: number): string {
  const d = new Date();
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, maxDay));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export const BARBERSHOP_ID = "local-dev-barbershop";
export const BARBERSHOP_SLUG = "barbearia-do-joao";

// ── Barbershops
export const mockBarbershops = [
  {
    id: BARBERSHOP_ID,
    name: "Barbearia do João",
    slug: BARBERSHOP_SLUG,
    phone: "42999990001",
    address: "Rua das Tesouras, 42 - Centro",
    logo_url: null as string | null,
    booking_interval_minutes: 30,
    max_advance_days: 30,
    onboarded: true,
    created_at: localDate(-90) + "T10:00:00",
  },
];

// ── Professionals
export const mockProfessionals = [
  {
    id: "prof-joao",
    barbershop_id: BARBERSHOP_ID,
    name: "João Silva",
    phone: "42999990002",
    specialties: "Corte, Barba, Pigmentação",
    active: true,
    created_at: localDate(-90) + "T10:00:00",
  },
  {
    id: "prof-pedro",
    barbershop_id: BARBERSHOP_ID,
    name: "Pedro Alves",
    phone: "42999990003",
    specialties: "Corte, Sobrancelha",
    active: true,
    created_at: localDate(-60) + "T10:00:00",
  },
];

// ── Services
export const mockServices = [
  { id: "svc-corte", barbershop_id: BARBERSHOP_ID, name: "Corte", duration_minutes: 30, price: 35, active: true, created_at: localDate(-90) + "T10:00:00" },
  { id: "svc-barba", barbershop_id: BARBERSHOP_ID, name: "Barba", duration_minutes: 20, price: 25, active: true, created_at: localDate(-90) + "T10:00:00" },
  { id: "svc-corte-barba", barbershop_id: BARBERSHOP_ID, name: "Corte + Barba", duration_minutes: 50, price: 55, active: true, created_at: localDate(-90) + "T10:00:00" },
  { id: "svc-sobrancelha", barbershop_id: BARBERSHOP_ID, name: "Sobrancelha", duration_minutes: 15, price: 15, active: true, created_at: localDate(-90) + "T10:00:00" },
  { id: "svc-pigmentacao", barbershop_id: BARBERSHOP_ID, name: "Pigmentação", duration_minutes: 40, price: 45, active: true, created_at: localDate(-90) + "T10:00:00" },
];

// ── Business hours (0=Dom fechado, 1-5=08-20, 6=08-15)
export const mockBusinessHours = [
  { id: "bh-0", barbershop_id: BARBERSHOP_ID, day_of_week: 0, open_time: "08:00", close_time: "20:00", is_closed: true },
  { id: "bh-1", barbershop_id: BARBERSHOP_ID, day_of_week: 1, open_time: "08:00", close_time: "20:00", is_closed: false },
  { id: "bh-2", barbershop_id: BARBERSHOP_ID, day_of_week: 2, open_time: "08:00", close_time: "20:00", is_closed: false },
  { id: "bh-3", barbershop_id: BARBERSHOP_ID, day_of_week: 3, open_time: "08:00", close_time: "20:00", is_closed: false },
  { id: "bh-4", barbershop_id: BARBERSHOP_ID, day_of_week: 4, open_time: "08:00", close_time: "20:00", is_closed: false },
  { id: "bh-5", barbershop_id: BARBERSHOP_ID, day_of_week: 5, open_time: "08:00", close_time: "20:00", is_closed: false },
  { id: "bh-6", barbershop_id: BARBERSHOP_ID, day_of_week: 6, open_time: "08:00", close_time: "15:00", is_closed: false },
];

// ── Professional business hours (none custom — they use barbershop hours)
export const mockProfessionalBusinessHours: any[] = [];

// ── Professional services (João faz tudo, Pedro faz corte e sobrancelha)
export const mockProfessionalServices = [
  { id: "ps-1", barbershop_id: BARBERSHOP_ID, professional_id: "prof-joao", service_id: "svc-corte" },
  { id: "ps-2", barbershop_id: BARBERSHOP_ID, professional_id: "prof-joao", service_id: "svc-barba" },
  { id: "ps-3", barbershop_id: BARBERSHOP_ID, professional_id: "prof-joao", service_id: "svc-corte-barba" },
  { id: "ps-4", barbershop_id: BARBERSHOP_ID, professional_id: "prof-joao", service_id: "svc-sobrancelha" },
  { id: "ps-5", barbershop_id: BARBERSHOP_ID, professional_id: "prof-joao", service_id: "svc-pigmentacao" },
  { id: "ps-6", barbershop_id: BARBERSHOP_ID, professional_id: "prof-pedro", service_id: "svc-corte" },
  { id: "ps-7", barbershop_id: BARBERSHOP_ID, professional_id: "prof-pedro", service_id: "svc-corte-barba" },
  { id: "ps-8", barbershop_id: BARBERSHOP_ID, professional_id: "prof-pedro", service_id: "svc-sobrancelha" },
];

// ── Clients (3 criados neste mês para "Clientes novos: 3")
export const mockClients = [
  {
    id: "cli-carlos",
    barbershop_id: BARBERSHOP_ID,
    name: "Carlos Mendes",
    phone: "42999990010",
    email: "carlos@email.com",
    total_visits: 8,
    total_spent: 280,
    last_visit: localDate(-5),
    created_at: localDate(-120) + "T09:00:00",
    notes: null as string | null,
  },
  {
    id: "cli-ana",
    barbershop_id: BARBERSHOP_ID,
    name: "Ana Paula",
    phone: "42999990011",
    email: null as string | null,
    total_visits: 3,
    total_spent: 95,
    last_visit: localDate(-45),
    created_at: monthDay(3) + "T09:00:00",
    notes: null as string | null,
  },
  {
    id: "cli-roberto",
    barbershop_id: BARBERSHOP_ID,
    name: "Roberto Lima",
    phone: "42999990012",
    email: null as string | null,
    total_visits: 12,
    total_spent: 420,
    last_visit: localDate(-2),
    created_at: localDate(-200) + "T09:00:00",
    notes: "Prefere corte com máquina 2",
  },
  {
    id: "cli-fernanda",
    barbershop_id: BARBERSHOP_ID,
    name: "Fernanda Costa",
    phone: "42999990013",
    email: null as string | null,
    total_visits: 1,
    total_spent: 35,
    last_visit: localDate(-62),
    created_at: monthDay(5) + "T09:00:00",
    notes: null as string | null,
  },
  {
    id: "cli-marcos",
    barbershop_id: BARBERSHOP_ID,
    name: "Marcos Souza",
    phone: "42999990014",
    email: null as string | null,
    total_visits: 5,
    total_spent: 175,
    last_visit: localDate(-10),
    created_at: localDate(-150) + "T09:00:00",
    notes: null as string | null,
  },
  {
    id: "cli-lucas",
    barbershop_id: BARBERSHOP_ID,
    name: "Lucas Pereira",
    phone: "42999990015",
    email: null as string | null,
    total_visits: 1,
    total_spent: 55,
    last_visit: localDate(0),
    created_at: localDate(0) + "T08:00:00",
    notes: null as string | null,
  },
];

// ── Appointments
export const mockAppointments = [
  // Hoje — 4 agendamentos
  {
    id: "appt-hoje-1",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-carlos",
    service_id: "svc-corte",
    professional_id: "prof-joao",
    date: localDate(0),
    time: "09:00",
    duration_minutes: 30,
    status: "confirmed",
    notes: null as string | null,
    created_at: localDate(-1) + "T20:00:00",
  },
  {
    id: "appt-hoje-2",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-lucas",
    service_id: "svc-corte-barba",
    professional_id: "prof-pedro",
    date: localDate(0),
    time: "10:30",
    duration_minutes: 50,
    status: "pending",
    notes: null as string | null,
    created_at: localDate(0) + "T08:00:00",
  },
  {
    id: "appt-hoje-3",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-roberto",
    service_id: "svc-barba",
    professional_id: "prof-joao",
    date: localDate(0),
    time: "14:00",
    duration_minutes: 20,
    status: "confirmed",
    notes: null as string | null,
    created_at: localDate(-1) + "T20:00:00",
  },
  {
    id: "appt-hoje-4",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-marcos",
    service_id: "svc-pigmentacao",
    professional_id: "prof-joao",
    date: localDate(0),
    time: "16:00",
    duration_minutes: 40,
    status: "confirmed",
    notes: null as string | null,
    created_at: localDate(-1) + "T20:00:00",
  },
  // Agendamento futuro do Marcos (mantém badge ATIVO)
  {
    id: "appt-fut-1",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-marcos",
    service_id: "svc-corte",
    professional_id: "prof-joao",
    date: localDate(3),
    time: "10:00",
    duration_minutes: 30,
    status: "confirmed",
    notes: null as string | null,
    created_at: localDate(0) + "T09:00:00",
  },
  // Esta semana — mais agendamentos
  {
    id: "appt-sem-1",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-carlos",
    service_id: "svc-barba",
    professional_id: "prof-joao",
    date: localDate(1),
    time: "09:30",
    duration_minutes: 20,
    status: "confirmed",
    notes: null as string | null,
    created_at: localDate(0) + "T09:00:00",
  },
  {
    id: "appt-sem-2",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-roberto",
    service_id: "svc-corte-barba",
    professional_id: "prof-pedro",
    date: localDate(2),
    time: "11:00",
    duration_minutes: 50,
    status: "pending",
    notes: null as string | null,
    created_at: localDate(0) + "T09:00:00",
  },
  // Passados concluídos
  {
    id: "appt-past-1",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-carlos",
    service_id: "svc-corte-barba",
    professional_id: "prof-joao",
    date: localDate(-7),
    time: "09:00",
    duration_minutes: 50,
    status: "completed",
    notes: null as string | null,
    created_at: localDate(-7) + "T09:00:00",
  },
  {
    id: "appt-past-2",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-roberto",
    service_id: "svc-corte",
    professional_id: "prof-pedro",
    date: localDate(-5),
    time: "11:00",
    duration_minutes: 30,
    status: "completed",
    notes: null as string | null,
    created_at: localDate(-5) + "T11:00:00",
  },
  {
    id: "appt-past-3",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-carlos",
    service_id: "svc-barba",
    professional_id: "prof-joao",
    date: localDate(-3),
    time: "15:00",
    duration_minutes: 20,
    status: "completed",
    notes: null as string | null,
    created_at: localDate(-3) + "T15:00:00",
  },
  {
    id: "appt-past-4",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-roberto",
    service_id: "svc-corte-barba",
    professional_id: "prof-joao",
    date: localDate(-2),
    time: "14:00",
    duration_minutes: 50,
    status: "completed",
    notes: null as string | null,
    created_at: localDate(-2) + "T14:00:00",
  },
  {
    id: "appt-past-5",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-lucas",
    service_id: "svc-corte-barba",
    professional_id: "prof-pedro",
    date: localDate(-10),
    time: "09:30",
    duration_minutes: 50,
    status: "completed",
    notes: null as string | null,
    created_at: localDate(-10) + "T09:30:00",
  },
];

// ── Products
export const mockProducts = [
  {
    id: "prod-pomada",
    barbershop_id: BARBERSHOP_ID,
    name: "Pomada Matte",
    category: "Pomada",
    description: "Pomada matte efeito seco, fixação forte",
    stock_quantity: 3,
    min_stock_alert: 5,
    cost: 18,
    price: 35,
    active: true,
    created_at: localDate(-90) + "T10:00:00",
  },
  {
    id: "prod-shampoo",
    barbershop_id: BARBERSHOP_ID,
    name: "Shampoo Premium",
    category: "Shampoo",
    description: "Shampoo profissional para cabelos tratados",
    stock_quantity: 8,
    min_stock_alert: 3,
    cost: 12,
    price: 28,
    active: true,
    created_at: localDate(-90) + "T10:00:00",
  },
  {
    id: "prod-oleo",
    barbershop_id: BARBERSHOP_ID,
    name: "Óleo de Barba",
    category: "Barba",
    description: "Óleo hidratante para barba e bigode",
    stock_quantity: 2,
    min_stock_alert: 4,
    cost: 22,
    price: 45,
    active: true,
    created_at: localDate(-90) + "T10:00:00",
  },
  {
    id: "prod-pente",
    barbershop_id: BARBERSHOP_ID,
    name: "Pente Profissional",
    category: "Ferramenta",
    description: "Pente de carbono profissional antiestático",
    stock_quantity: 6,
    min_stock_alert: 2,
    cost: 10,
    price: 22,
    active: true,
    created_at: localDate(-90) + "T10:00:00",
  },
];

// ── Stock movements
export const mockStockMovements: any[] = [
  {
    id: "sm-1",
    product_id: "prod-pomada",
    type: "in",
    quantity: 10,
    reason: "Compra inicial",
    created_at: localDate(-90) + "T10:00:00",
  },
  {
    id: "sm-2",
    product_id: "prod-pomada",
    type: "out",
    quantity: 7,
    reason: "Venda no atendimento",
    created_at: localDate(-30) + "T14:00:00",
  },
  {
    id: "sm-3",
    product_id: "prod-oleo",
    type: "in",
    quantity: 6,
    reason: "Compra inicial",
    created_at: localDate(-90) + "T10:00:00",
  },
  {
    id: "sm-4",
    product_id: "prod-oleo",
    type: "out",
    quantity: 4,
    reason: "Venda no atendimento",
    created_at: localDate(-20) + "T11:00:00",
  },
  {
    id: "sm-5",
    product_id: "prod-shampoo",
    type: "in",
    quantity: 10,
    reason: "Reposição",
    created_at: localDate(-15) + "T09:00:00",
  },
];

// ── Sales (para mostrar faturamento hoje)
export const mockSales = [
  {
    id: "sale-today-1",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-carlos",
    professional_id: "prof-joao",
    appointment_id: "appt-past-3",
    payment_method: "pix",
    total_amount: 55,
    created_at: localDate(0) + "T09:00:00",
  },
  {
    id: "sale-today-2",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-lucas",
    professional_id: "prof-pedro",
    appointment_id: null as string | null,
    payment_method: "cash",
    total_amount: 55,
    created_at: localDate(0) + "T10:00:00",
  },
  {
    id: "sale-today-3",
    barbershop_id: BARBERSHOP_ID,
    client_id: "cli-roberto",
    professional_id: "prof-joao",
    appointment_id: null as string | null,
    payment_method: "pix",
    total_amount: 35,
    created_at: localDate(0) + "T11:00:00",
  },
];

export const mockSaleItems: any[] = [];

// ── Financial entries (mês atual)
export const mockFinancialEntries = [
  // Serviços — receitas
  { id: "fin-001", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte", description: "Carlos Mendes — Corte", amount: 35, date: monthDay(2), payment_method: "pix" },
  { id: "fin-002", barbershop_id: BARBERSHOP_ID, type: "income", category: "Barba", description: "Roberto Lima — Barba", amount: 25, date: monthDay(3), payment_method: "cash" },
  { id: "fin-003", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte + Barba", description: "Lucas Pereira — Corte + Barba", amount: 55, date: monthDay(4), payment_method: "pix" },
  { id: "fin-004", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte", description: "Marcos Souza — Corte", amount: 35, date: monthDay(5), payment_method: "debit" },
  { id: "fin-005", barbershop_id: BARBERSHOP_ID, type: "income", category: "Pigmentação", description: "Carlos Mendes — Pigmentação", amount: 45, date: monthDay(6), payment_method: "pix" },
  { id: "fin-006", barbershop_id: BARBERSHOP_ID, type: "income", category: "Barba", description: "Roberto Lima — Barba", amount: 25, date: monthDay(7), payment_method: "pix" },
  { id: "fin-007", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte + Barba", description: "Lucas Pereira — Corte + Barba", amount: 55, date: monthDay(8), payment_method: "cash" },
  { id: "fin-008", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte", description: "Marcos Souza — Corte", amount: 35, date: monthDay(9), payment_method: "credit" },
  { id: "fin-009", barbershop_id: BARBERSHOP_ID, type: "income", category: "Sobrancelha", description: "Fernanda Costa — Sobrancelha", amount: 15, date: monthDay(10), payment_method: "pix" },
  { id: "fin-010", barbershop_id: BARBERSHOP_ID, type: "income", category: "Barba", description: "Carlos Mendes — Barba", amount: 25, date: monthDay(11), payment_method: "debit" },
  { id: "fin-011", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte", description: "Roberto Lima — Corte", amount: 35, date: monthDay(12), payment_method: "pix" },
  { id: "fin-012", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte + Barba", description: "Marcos Souza — Corte + Barba", amount: 55, date: monthDay(13), payment_method: "cash" },
  { id: "fin-013", barbershop_id: BARBERSHOP_ID, type: "income", category: "Pigmentação", description: "Lucas Pereira — Pigmentação", amount: 45, date: monthDay(14), payment_method: "pix" },
  { id: "fin-014", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte", description: "Carlos Mendes — Corte", amount: 35, date: monthDay(15), payment_method: "pix" },
  { id: "fin-015", barbershop_id: BARBERSHOP_ID, type: "income", category: "Barba", description: "Roberto Lima — Barba", amount: 25, date: monthDay(16), payment_method: "cash" },
  { id: "fin-016", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte", description: "Marcos Souza — Corte", amount: 35, date: monthDay(17), payment_method: "debit" },
  { id: "fin-017", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte + Barba", description: "Carlos Mendes — Corte + Barba", amount: 55, date: monthDay(18), payment_method: "pix" },
  { id: "fin-018", barbershop_id: BARBERSHOP_ID, type: "income", category: "Corte", description: "Lucas Pereira — Corte", amount: 35, date: monthDay(19), payment_method: "cash" },
  // Produtos vendidos
  { id: "fin-019", barbershop_id: BARBERSHOP_ID, type: "income", category: "Produto vendido", description: "Pomada Matte x1", amount: 35, date: monthDay(3), payment_method: "pix" },
  { id: "fin-020", barbershop_id: BARBERSHOP_ID, type: "income", category: "Produto vendido", description: "Shampoo Premium x1", amount: 28, date: monthDay(9), payment_method: "cash" },
  { id: "fin-021", barbershop_id: BARBERSHOP_ID, type: "income", category: "Produto vendido", description: "Óleo de Barba x1", amount: 45, date: monthDay(14), payment_method: "pix" },
  { id: "fin-022", barbershop_id: BARBERSHOP_ID, type: "income", category: "Produto vendido", description: "Pomada Matte x1", amount: 35, date: monthDay(17), payment_method: "debit" },
  // Despesas
  { id: "fin-023", barbershop_id: BARBERSHOP_ID, type: "expense", category: "Aluguel", description: "Aluguel mensal", amount: 800, date: monthDay(5), payment_method: "pix" },
  { id: "fin-024", barbershop_id: BARBERSHOP_ID, type: "expense", category: "Energia", description: "Conta de energia", amount: 150, date: monthDay(10), payment_method: "pix" },
  { id: "fin-025", barbershop_id: BARBERSHOP_ID, type: "expense", category: "Produtos", description: "Reposição de produtos", amount: 220, date: monthDay(8), payment_method: "debit" },
];

// ── Fixed costs
export const mockFixedCosts = [
  { id: "fc-1", barbershop_id: BARBERSHOP_ID, name: "Aluguel", amount: 800, due_day: 5, active: true, created_at: localDate(-90) + "T10:00:00" },
  { id: "fc-2", barbershop_id: BARBERSHOP_ID, name: "Energia", amount: 150, due_day: 10, active: true, created_at: localDate(-90) + "T10:00:00" },
  { id: "fc-3", barbershop_id: BARBERSHOP_ID, name: "Internet", amount: 80, due_day: 15, active: true, created_at: localDate(-90) + "T10:00:00" },
];

// ── All tables for the store
export const mockTables: Record<string, Record<string, unknown>[]> = {
  barbershops: mockBarbershops as Record<string, unknown>[],
  professionals: mockProfessionals as Record<string, unknown>[],
  services: mockServices as Record<string, unknown>[],
  business_hours: mockBusinessHours as Record<string, unknown>[],
  professional_business_hours: mockProfessionalBusinessHours,
  professional_services: mockProfessionalServices as Record<string, unknown>[],
  clients: mockClients as Record<string, unknown>[],
  appointments: mockAppointments as Record<string, unknown>[],
  products: mockProducts as Record<string, unknown>[],
  stock_movements: mockStockMovements,
  sales: mockSales as Record<string, unknown>[],
  sale_items: mockSaleItems,
  financial_entries: mockFinancialEntries as Record<string, unknown>[],
  fixed_costs: mockFixedCosts as Record<string, unknown>[],
};
