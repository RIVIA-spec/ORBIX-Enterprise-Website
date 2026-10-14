class Property {


  final String title;
  final String location;
  final String description;
  final int bathrooms;
  final int rooms;
  final double area;
  final double rating;
  final int price;
  final String mainImage;    
  final List<String> images;

  Property({
    required this.title,
    required this.location,
    required this.description,
    required this.bathrooms,
    required this.rooms,
    required this.area,
    required this.rating,
    required this.price,
    required this.mainImage,
    required this.images,
  });
}

