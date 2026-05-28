"use client";

import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldLabel,
  FieldContent,
  FieldError,
} from "@/components/ui/field";
import { useCreateProduct } from "../mutations";
import { useCategories } from "../../products/queries";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be positive"),
  stockQuantity: z.number().int().nonnegative("Stock must be non-negative"),
  categoryId: z.string().min(1, "Please select a category"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm() {
  const router = useRouter();
  const { mutate: createProduct, isPending } = useCreateProduct();
  
  const { 
    data: categories, 
    isLoading: isLoadingCategories, 
    isError: isCategoriesError 
  } = useCategories();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stockQuantity: 0,
      categoryId: "",
    },
  });

  const onSubmit: SubmitHandler<ProductFormValues> = (values) => {
    createProduct(values, {
      onSuccess: () => {
        toast.success("Product created successfully! It will be visible once approved.");
        router.push("/dashboard/seller/products");
      },
      onError: (error) => {
        toast.error(`Failed to create product: ${error.message}`);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Field>
        <FieldLabel>Product Name</FieldLabel>
        <FieldContent>
          <Input placeholder="e.g. Premium Wireless Headphones" {...register("name")} />
          <FieldError errors={[errors.name]} />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>Description</FieldLabel>
        <FieldContent>
          <Textarea 
            placeholder="Tell customers about your product..." 
            className="min-h-32" 
            {...register("description")}
          />
          <FieldError errors={[errors.description]} />
        </FieldContent>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field>
          <FieldLabel>Price ($)</FieldLabel>
          <FieldContent>
            <Input 
              type="number" 
              step="0.01" 
              {...register("price", { valueAsNumber: true })} 
            />
            <FieldError errors={[errors.price]} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Stock Quantity</FieldLabel>
          <FieldContent>
            <Input 
              type="number" 
              {...register("stockQuantity", { valueAsNumber: true })} 
            />
            <FieldError errors={[errors.stockQuantity]} />
          </FieldContent>
        </Field>
      </div>

      <Field>
        <FieldLabel>Category</FieldLabel>
        <FieldContent>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={isLoadingCategories || isCategoriesError}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingCategories ? "Loading categories..." : 
                      isCategoriesError ? "Error loading categories" : 
                      "Select a category"
                    }
                  >
                    {(value) => {
                      if (!value) return undefined;
                      return categories?.find((c: any) => c.id === value)?.name ?? value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories?.length === 0 && !isLoadingCategories && (
                    <div className="p-2 text-xs text-muted-foreground">No categories found</div>
                  )}
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.categoryId, isCategoriesError ? { message: "Could not load categories. Please check if the service is running." } : undefined]} />
        </FieldContent>
      </Field>

      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
