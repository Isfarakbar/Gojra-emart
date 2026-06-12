import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class WhatsAppOrdersScreen extends StatefulWidget {
  const WhatsAppOrdersScreen({super.key});

  @override
  State<WhatsAppOrdersScreen> createState() => _WhatsAppOrdersScreenState();
}

class _WhatsAppOrdersScreenState extends State<WhatsAppOrdersScreen> {
  List<dynamic> _messages = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMessages();
  }

  Future<void> _fetchMessages() async {
    try {
      final response = await ApiService().dio.get('/webhook/orders');
      setState(() {
        _messages = response.data;
        _isLoading = false;
      });
    } catch (e) {
      print(e);
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("WhatsApp Orders")),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _messages.length,
              itemBuilder: (ctx, i) {
                final msg = _messages[i];
                return ListTile(
                  title: Text(msg['from']),
                  subtitle: Text(msg['messageBody']),
                  trailing: Text(msg['status']),
                );
              },
            ),
    );
  }
}
