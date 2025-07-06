export interface ClientData {
  id: string;
  name: string;
  country: string;
  cuit: string;
  foreignTaxId?: string;
  companyName: string;
  address: string;
  email: string;
  paymentMethod?: string;
  incoterm?: string;
  incotermDetail?: string;
  otherData?: string;
  createdAt: number;
  updatedAt: number;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  clientId?: string;
  data: Partial<ClientData>;
  createdAt: number;
  updatedAt: number;
}

class AfipStorage {
  private static instance: AfipStorage;
  
  static getInstance(): AfipStorage {
    if (!AfipStorage.instance) {
      AfipStorage.instance = new AfipStorage();
    }
    return AfipStorage.instance;
  }

  async saveClient(client: Omit<ClientData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const clients = await this.getClients();
    const id = this.generateId();
    const now = Date.now();
    
    const newClient: ClientData = {
      ...client,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    clients.push(newClient);
    await browser.storage.local.set({ clients });
    return id;
  }

  async updateClient(id: string, updates: Partial<ClientData>): Promise<void> {
    const clients = await this.getClients();
    const index = clients.findIndex(c => c.id === id);
    
    if (index !== -1) {
      clients[index] = {
        ...clients[index],
        ...updates,
        updatedAt: Date.now()
      };
      await browser.storage.local.set({ clients });
    }
  }

  async deleteClient(id: string): Promise<void> {
    const clients = await this.getClients();
    const filtered = clients.filter(c => c.id !== id);
    await browser.storage.local.set({ clients: filtered });
  }

  async getClients(): Promise<ClientData[]> {
    const result = await browser.storage.local.get('clients');
    return result.clients || [];
  }

  async getClient(id: string): Promise<ClientData | null> {
    const clients = await this.getClients();
    return clients.find(c => c.id === id) || null;
  }

  async saveTemplate(template: Omit<InvoiceTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const templates = await this.getTemplates();
    const id = this.generateId();
    const now = Date.now();
    
    const newTemplate: InvoiceTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    templates.push(newTemplate);
    await browser.storage.local.set({ templates });
    return id;
  }

  async updateTemplate(id: string, updates: Partial<InvoiceTemplate>): Promise<void> {
    const templates = await this.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index !== -1) {
      templates[index] = {
        ...templates[index],
        ...updates,
        updatedAt: Date.now()
      };
      await browser.storage.local.set({ templates });
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await browser.storage.local.set({ templates: filtered });
  }

  async getTemplates(): Promise<InvoiceTemplate[]> {
    const result = await browser.storage.local.get('templates');
    return result.templates || [];
  }

  async getTemplate(id: string): Promise<InvoiceTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  async exportData(): Promise<string> {
    const [clients, templates] = await Promise.all([
      this.getClients(),
      this.getTemplates()
    ]);
    
    return JSON.stringify({
      clients,
      templates,
      exportedAt: Date.now(),
      version: '1.0'
    }, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.clients && Array.isArray(data.clients)) {
        await browser.storage.local.set({ clients: data.clients });
      }
      
      if (data.templates && Array.isArray(data.templates)) {
        await browser.storage.local.set({ templates: data.templates });
      }
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

export const storage = AfipStorage.getInstance();