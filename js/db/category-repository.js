// Category Repository - Specialized operations for categories and subcategories
class CategoryRepository extends BaseRepository {
  constructor() {
    super(DBConfig.STORES.CATEGORIES);
  }

  /**
   * Add a new category with auto-generated ID
   */
  async addCategory(category) {
    category.id = Date.now().toString();
    category.createdAt = new Date().toISOString();
    category.subcategories = category.subcategories || [];
    return await this.add(category);
  }

  /**
   * Add a subcategory to an existing category
   */
  async addSubcategory(categoryId, subcategory) {
    const category = await this.getById(categoryId);
    if (category) {
      const now = new Date();
      subcategory.id = Date.now().toString();
      subcategory.createdAt = now.toISOString();
      subcategory.categoryId = categoryId;

      // Calculate dates from frequency
      subcategory.startDate = subcategory.startDate || Helpers.getDefaultStartDate(subcategory.frequency);
      subcategory.endDate = Helpers.getEndDate(subcategory.startDate, subcategory.frequency);

      category.subcategories.push(subcategory);
      return await this.update(category);
    }
    return false;
  }

  /**
   * Update a subcategory within a category
   */
  async updateSubcategory(categoryId, subcategoryId, updates) {
    const category = await this.getById(categoryId);
    if (category) {
      const subIndex = category.subcategories.findIndex(sub => sub.id === subcategoryId);
      if (subIndex !== -1) {
        const updatedSub = { ...category.subcategories[subIndex], ...updates };

        // Recalculate endDate if startDate or frequency changes
        if (updates.startDate || updates.frequency) {
          updatedSub.startDate = updates.startDate || updatedSub.startDate;
          updatedSub.frequency = updates.frequency || updatedSub.frequency;
          updatedSub.endDate = Helpers.getEndDate(updatedSub.startDate, updatedSub.frequency);
        }

        category.subcategories[subIndex] = updatedSub;
        return await this.update(category);
      }
    }
    return false;
  }

  /**
   * Delete a subcategory from a category
   */
  async deleteSubcategory(categoryId, subcategoryId) {
    const category = await this.getById(categoryId);
    if (category) {
      const subIndex = category.subcategories.findIndex(sub => sub.id === subcategoryId);
      if (subIndex !== -1) {
        category.subcategories.splice(subIndex, 1);
        return await this.update(category);
      }
    }
    return false;
  }

  /**
   * Get a specific subcategory
   */
  async getSubcategory(categoryId, subcategoryId) {
    const category = await this.getById(categoryId);
    if (category) {
      return category.subcategories.find(sub => sub.id === subcategoryId);
    }
    return null;
  }

  /**
   * Get all subcategories from all categories
   */
  async getAllSubcategories() {
    const categories = await this.getAll();
    const subcategories = [];
    categories.forEach(category => {
      if (category.subcategories) {
        subcategories.push(...category.subcategories.map(sub => ({
          ...sub,
          categoryId: category.id,
          categoryName: category.name
        })));
      }
    });
    return subcategories;
  }

  /**
   * Get subcategories by category ID
   */
  async getSubcategoriesByCategoryId(categoryId) {
    const category = await this.getById(categoryId);
    return category ? category.subcategories : [];
  }

  /**
   * Update category (without affecting subcategories)
   */
  async updateCategory(categoryId, updates) {
    const category = await this.getById(categoryId);
    if (category) {
      // Preserve subcategories
      const updatedCategory = { ...category, ...updates };
      updatedCategory.subcategories = category.subcategories;
      return await this.update(updatedCategory);
    }
    return false;
  }
}
